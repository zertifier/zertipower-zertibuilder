import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { RoofInput } from './roof-simulation.service';

export const CALCULATOR_DEFAULT_TILT = 25;
export const CALCULATOR_DEFAULT_AZIMUTH = 0;
export const CALCULATOR_PANEL_KWP = 0.45;
export const CALCULATOR_USABLE_AREA = 0.8;

export interface CalculatorRoof extends RoofInput {
  energyAreaId: number;
  roofReference: string;
  areaM2: number;
  panelCount: number;
}

@Injectable()
export class CommunityMemberRoofsService {
  private readonly logger = new Logger(CommunityMemberRoofsService.name);
  constructor(private prisma: PrismaService) {}

  /** Exactly the areas returned by the calculator's /energy-areas/by-location call. */
  async getCalculatorRoofs(communityId: number) {
    if (!Number.isSafeInteger(communityId) || communityId <= 0) throw new BadRequestException('Invalid community ID');
    const community = await this.prisma.communities.findUnique({ where: { id: communityId }, select: { id: true, locationId: true } });
    if (!community || community.locationId == null) throw new BadRequestException('Community has no calculator location');
    const areas = await this.prisma.energyArea.findMany({
      where: { locationId: community.locationId }, select: { id: true, reference: true, m2: true, geojsonFeature: true }, orderBy: { id: 'asc' },
    });
    const roofs: CalculatorRoof[] = [];
    for (const area of areas) {
      // The calculator renders the GeoJSON returned by /by-location and only
      // obtains an area after a polygon feature is selected. Coordinate rows
      // and the persisted m2 value are not a substitute for that geometry.
      const polygon = this.geoJsonPolygon(area.geojsonFeature);
      if (polygon.length < 3) continue;
      // Match google.maps.geometry.spherical.computeArea followed by floor().
      const areaM2 = Math.floor(this.sphericalAreaM2(polygon));
      if (!Number.isFinite(areaM2) || areaM2 <= 0) continue;
      // Same formula as energy-areas.controller.ts calculate(): area * 0.8 / 6.
      const kwp = Number(((areaM2 * CALCULATOR_USABLE_AREA) / 6).toFixed(1));
      const panelCount = Math.ceil(kwp / CALCULATOR_PANEL_KWP);
      if (kwp <= 0 || panelCount <= 0) continue;
      roofs.push({ energyAreaId: area.id, roofReference: String(area.reference || area.id), areaM2, panelCount,
        latitude: polygon.reduce((sum, point) => sum + point.lat, 0) / polygon.length,
        longitude: polygon.reduce((sum, point) => sum + point.lng, 0) / polygon.length,
        kwp, tilt: CALCULATOR_DEFAULT_TILT, azimuth: CALCULATOR_DEFAULT_AZIMUTH });
    }
    const result = { roofs, locationId: community.locationId,
      energyAreasInLocation: areas.length,
      calculatorSelectableRoofs: roofs.length,
      totalRoofAreaM2: roofs.reduce((sum, roof) => sum + roof.areaM2, 0),
      totalInstalledPowerKwp: roofs.reduce((sum, roof) => sum + roof.kwp, 0) };
    this.logger.log(JSON.stringify({ communityId, locationId: result.locationId,
      energyAreasInLocation: result.energyAreasInLocation,
      calculatorSelectableRoofs: result.calculatorSelectableRoofs,
      roofsSimulated: roofs.length, totalRoofAreaM2: result.totalRoofAreaM2, totalInstalledPowerKwp: result.totalInstalledPowerKwp }));
    return result;
  }

  async get(communityId: number) { return this.getCalculatorRoofs(communityId); }

  private geoJsonPolygon(raw: string | null): { lat: number; lng: number }[] {
    if (!raw) return [];
    try {
      const feature = JSON.parse(raw);
      const geometry = feature?.type === 'Feature' ? feature.geometry : feature;
      const coordinates = geometry?.coordinates;
      if (geometry?.type !== 'Polygon' && geometry?.type !== 'MultiPolygon') return [];
      const ring = geometry.type === 'Polygon' ? coordinates?.[0] : coordinates?.[0]?.[0];
      if (!Array.isArray(ring)) return [];
      return ring.map((point: any) => ({ lat: Number(point[1]), lng: Number(point[0]) }))
        .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng)
          && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180);
    } catch { return []; }
  }

  private sphericalAreaM2(path: { lat: number; lng: number }[]): number {
    if (path.length < 3) return 0;
    const earthRadiusM = 6378137;
    let area = 0;
    for (let i = 0; i < path.length; i++) {
      const a = path[i], b = path[(i + 1) % path.length];
      const lngDelta = (b.lng - a.lng) * Math.PI / 180;
      area += lngDelta * (2 + Math.sin(a.lat * Math.PI / 180) + Math.sin(b.lat * Math.PI / 180));
    }
    return Math.abs(area * earthRadiusM * earthRadiusM / 2);
  }
}
