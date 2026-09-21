import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { EnergyForecastService, SolarInstallation } from './energy-forecast.service';
import { BadRequestError } from '../../../../shared/domain/error/common';

export interface CalculadoraSolarConfig {
  cupsId: number; lat: number; lng: number; m2: number | null;
  orientation: number; inclination: number; n_plaques: number | null;
  kwp: number; potencia_inversor_kw: number; performance_ratio: number;
  energyAreaId: number | null; source: string;
}
@Injectable()
export class CalculadoraIntegrationService {
  constructor(private prisma: PrismaService, private forecast: EnergyForecastService) {}
  async getSolarConfigFromCalculadora(cupsId: number): Promise<CalculadoraSolarConfig | null> {
    if (!Number.isSafeInteger(cupsId) || cupsId <= 0) throw new BadRequestError('Invalid CUPS ID');
    const cups = await this.prisma.cups.findUnique({ where: { id: cupsId } });
    if (!cups) return null;
    const community = cups.communityId == null ? undefined : await this.prisma.communities.findUnique({ where: { id: cups.communityId } });
    // No roof/CUPS foreign key exists. Require an explicit, confirmed mapping.
    let mapping: Record<string, number>;
    try { mapping = JSON.parse(process.env.SOLAR_CUPS_AREAS_JSON || '{}'); }
    catch { throw new BadRequestError('Invalid SOLAR_CUPS_AREAS_JSON'); }
    const areaId = mapping?.[String(cupsId)];
    if (areaId !== undefined && (!Number.isSafeInteger(areaId) || areaId <= 0)) throw new BadRequestError('Invalid energy area ID');
    const area = areaId === undefined ? null : await this.prisma.energyArea.findUnique({ where: { id: areaId } });
    if (areaId !== undefined && !area) throw new BadRequestError('Configured energy area not found');
    const values: Partial<SolarInstallation> = {};
    if (area?.kWhP != null) values.kwp = area.kWhP;
    if (area?.kWhInversor != null) values.potencia_inversor_kw = area.kWhInversor;
    if (area?.inclination != null) values.graus = area.inclination;
    const config = this.forecast.getInstallation(cups, community ?? undefined, values);
    const orientations: Record<string, number> = { nord: 180, 'nord-est': -135, est: -90,
      'sud-est': -45, sud: 0, 'sud-oest': 45, oest: 90, 'nord-oest': 135 };
    return { cupsId, lat: config.latitud, lng: config.longitud, kwp: config.kwp,
      potencia_inversor_kw: config.potencia_inversor_kw, inclination: config.graus,
      performance_ratio: config.performance_ratio,
      orientation: config.azimut ?? orientations[config.orientacio!],
      m2: area?.m2 ?? null, n_plaques: area?.nPlaques ?? null, energyAreaId: area?.id ?? null,
      source: area ? 'mapped-area-with-overrides-and-provisional-defaults' : 'cups-community-with-overrides-and-provisional-defaults' };
  }
  async getCommunityHouseConfigurations(communityId: number, useHistoricalInverter = true): Promise<SolarInstallation[]> {
    const cups = await this.prisma.cups.findMany({
      where: { communityId, active: true, type: { in: ['consumer', 'prosumer'] } },
      select: { id: true },
    });
    if (!cups.length) throw new BadRequestError('No active houses found for this community');
    const testArea = Number(process.env.SOLAR_TEST_HOUSE_M2 || 0);
    if (testArea > 0 && communityId === Number(process.env.SOLAR_TEST_COMMUNITY_ID)) {
      if (!Number.isFinite(testArea)) throw new BadRequestError('Invalid test house surface');
      const community = await this.prisma.communities.findUnique({ where: { id: communityId } });
      if (community?.lat == null || community.lng == null) throw new BadRequestError('Missing community coordinates for test');
      // Same area-to-capacity formula as the calculator for an inclined roof.
      const kwp = Math.round((testArea * 0.8 / 6) * 10) / 10;
      if (kwp <= 0) throw new BadRequestError('Test surface produces no installed capacity');
      const configurations: SolarInstallation[] = [];
      for (const cup of cups) {
        const maximum = useHistoricalInverter ? await this.prisma.energyHourly.aggregate({
          where: { cupsId: cup.id, production: { gt: 0 }, infoDt: { lt: new Date() } },
          _max: { production: true },
        }) : { _max: { production: kwp } };
        const inverter = maximum._max.production;
        if (inverter == null || !Number.isFinite(inverter) || inverter <= 0) {
          throw new BadRequestError(`CUPS ${cup.id} has no historical maximum for the test`);
        }
        configurations.push({ latitud: community.lat, longitud: community.lng, kwp,
          graus: 30, azimut: 45, performance_ratio: 0.8, potencia_inversor_kw: inverter });
      }
      return configurations;
    }

    const configurations: SolarInstallation[] = [];
    const usedAreas = new Set<number>();
    for (const cup of cups) {
      const config = await this.getSolarConfigFromCalculadora(cup.id);
      if (!config?.energyAreaId) throw new BadRequestError(`Missing roof/CUPS association for CUPS ${cup.id}; cannot calculate a complete community total`);
      if (usedAreas.has(config.energyAreaId)) throw new BadRequestError('A roof is assigned to multiple CUPS; resolve the association before summing production');
      usedAreas.add(config.energyAreaId);
      const area = await this.prisma.energyArea.findUnique({ where: { id: config.energyAreaId } });
      if (area?.kWhP == null || area.inclination == null) throw new BadRequestError(`Roof ${config.energyAreaId} has no stored capacity or inclination`);
      let properties: any;
      try { properties = JSON.parse(area.geojsonFeature || '{}').properties || {}; }
      catch { throw new BadRequestError('Invalid roof geometry'); }
      // Orientation must belong to the roof; never apply the former southwest default to every house.
      const orientation = properties.orientation;
      if (typeof orientation !== 'number' || !Number.isFinite(orientation) || Math.abs(orientation) > 180) {
        throw new BadRequestError(`Roof ${config.energyAreaId} has no stored orientation`);
      }
      const vertices = await this.prisma.energyAreaCoordinates.findMany({ where: { energyAreaId: config.energyAreaId } });
      if (!vertices.length) throw new BadRequestError(`Roof ${config.energyAreaId} has no coordinates`);
      const lat = vertices.reduce((sum, vertex) => sum + Number(vertex.lat), 0) / vertices.length;
      const lng = vertices.reduce((sum, vertex) => sum + Number(vertex.lng), 0) / vertices.length;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 ||
          !Number.isFinite(area.kWhP) || area.kWhP <= 0 || !Number.isFinite(area.inclination) || area.inclination < 0 || area.inclination > 90) {
        throw new BadRequestError(`Roof ${config.energyAreaId} has invalid installation data`);
      }
      const maximum = useHistoricalInverter ? await this.prisma.energyHourly.aggregate({
        where: { cupsId: cup.id, production: { gt: 0 }, infoDt: { lt: new Date() } },
        _max: { production: true },
      }) : { _max: { production: area.kWhP } };
      const inverterEstimate = maximum._max.production;
      if (inverterEstimate == null || !Number.isFinite(inverterEstimate) || inverterEstimate <= 0) {
        throw new BadRequestError(`CUPS ${cup.id} has no positive historical production for the inverter estimate`);
      }
      configurations.push({ latitud: lat, longitud: lng, kwp: area.kWhP,
        graus: area.inclination, azimut: orientation,
        performance_ratio: 0.8,
        // Requested proxy: maximum kWh in a one-hour record / 1h. Not a nameplate rating.
        potencia_inversor_kw: inverterEstimate });
    }
    return configurations;
  }

  // Read-only compatibility method. Does not save calculator simulations.
  async syncAllCupsWithCalculadora(communityId?: number): Promise<CalculadoraSolarConfig[]> {
    const cups = await this.prisma.cups.findMany({ where: communityId === undefined ? {} : { communityId }, select: { id: true } });
    const configs = await Promise.all(cups.map(c => this.getSolarConfigFromCalculadora(c.id)));
    return configs.filter((c): c is CalculadoraSolarConfig => c !== null);
  }
}
