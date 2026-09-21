import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'node:https';
import * as moment from 'moment-timezone';
import { BadRequestError, InfrastructureError } from '../../../../shared/domain/error/common';

export interface SolarInstallation {
  latitud: number;
  longitud: number;
  kwp: number;
  potencia_inversor_kw: number;
  graus: number;
  performance_ratio: number;
  orientacio?: string;
  azimut?: number;
}

// Local wall-clock timestamps from the API, kept for the existing chart contract.
export interface SolarForecastPoint { time: string; value: number; }

@Injectable()
export class EnergyForecastService {
  private httpClient = axios.create({
    timeout: 30000,
    httpsAgent: new https.Agent({
      rejectUnauthorized: process.env.SOLAR_API_ALLOW_INSECURE_TLS !== 'true',
    }),
  });

  getInstallation(
    cups: { id: number; lat: number | null; lng: number | null },
    community?: { lat: number | null; lng: number | null },
    areaConfiguration: Partial<SolarInstallation> = {},
  ): SolarInstallation {
    let configurations: Record<string, Partial<SolarInstallation>>;
    try {
      configurations = JSON.parse(process.env.SOLAR_INSTALLATIONS_JSON || '{}');
    } catch {
      throw new BadRequestError('SOLAR_INSTALLATIONS_JSON must be valid JSON');
    }
    const override = configurations?.[String(cups.id)] ?? {};
    if (typeof override !== 'object' || Array.isArray(override)) throw new BadRequestError('Invalid solar installation override');
    const configured = { ...areaConfiguration, ...override };
    if (typeof configured !== 'object' || Array.isArray(configured)) {
      throw new BadRequestError(`Invalid solar installation configuration for CUPS ID ${cups.id}`);
    }
    // Coordinates must come from the same source, never latitude from one site and longitude from another.
    const hasConfiguredCoordinates = configured.latitud !== undefined || configured.longitud !== undefined;
    if (hasConfiguredCoordinates && (configured.latitud == null || configured.longitud == null)) {
      throw new BadRequestError(`Configure both latitude and longitude for CUPS ID ${cups.id}`);
    }
    const coordinates = hasConfiguredCoordinates
      ? { latitud: configured.latitud, longitud: configured.longitud }
      : cups.lat != null && cups.lng != null
        ? { latitud: cups.lat, longitud: cups.lng }
        : community?.lat != null && community?.lng != null
          ? { latitud: community.lat, longitud: community.lng }
          : { latitud: 42.1833, longitud: 2.4833 };
    // Temporary defaults requested for local testing; override per CUPS with real specifications.
    const installation = {
      kwp: 7.22,
      potencia_inversor_kw: 6,
      graus: 30,
      performance_ratio: 0.8,
      ...(configured.azimut === undefined ? { orientacio: 'sud-oest' } : {}),
      ...configured,
      ...coordinates,
    } as SolarInstallation;
    const validNumber = (value: unknown, min: number, max: number) =>
      typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
    if (!validNumber(installation.latitud, -90, 90) ||
        !validNumber(installation.longitud, -180, 180) ||
        !validNumber(installation.kwp, Number.MIN_VALUE, Infinity) ||
        !validNumber(installation.potencia_inversor_kw, Number.MIN_VALUE, Infinity) ||
        !validNumber(installation.performance_ratio, Number.MIN_VALUE, 1) ||
        !validNumber(installation.graus, 0, 90) ||
        (installation.orientacio !== undefined) === (installation.azimut !== undefined) ||
        (installation.orientacio !== undefined &&
          !['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-oest', 'oest', 'nord-oest'].includes(installation.orientacio)) ||
        (installation.azimut !== undefined && !validNumber(installation.azimut, -180, 180))) {
      throw new BadRequestError(`Invalid solar installation configuration for CUPS ID ${cups.id}`);
    }
    return installation;
  }

  async getProductionForecast(
    installation: SolarInstallation,
    startDate = moment.tz('Europe/Madrid').format('YYYY-MM-DD'),
    endDate = moment.tz(startDate, 'Europe/Madrid').add(6, 'days').format('YYYY-MM-DD'),
    tariffs = { preu_punta_eur_kwh: 0.18, preu_pla_eur_kwh: 0.12, preu_vall_eur_kwh: 0.08 },
  ): Promise<SolarForecastPoint[]> {
    const authcode = process.env.SOLAR_API_AUTH_CODE;
    if (!authcode) throw new BadRequestError('SOLAR_API_AUTH_CODE is not configured');
    let payload: any;
    try {
      const response = await this.httpClient.get(
        process.env.SOLAR_API_URL || 'https://ai.megatro.cat:9999/previsio',
        {
          headers: { authcode },
          params: {
            ...installation,
            // The deployed API requires tariff inputs even for a production-only query.
            ...tariffs,
            data_inici: startDate,
            data_final: endDate,
          },
        },
      );
      payload = response.data;
    } catch {
      // Do not log Axios errors: request configuration contains the auth header.
      throw new InfrastructureError('Solar forecast API request failed');
    }
    if (!Array.isArray(payload?.dies)) throw new InfrastructureError('Invalid solar forecast response');
    const points: SolarForecastPoint[] = [];
    const days = new Set<string>();
    for (const day of payload.dies) {
      if (typeof day.data !== 'string' || day.data < startDate || day.data > endDate ||
          days.has(day.data) || !Array.isArray(day.hores) || day.hores.length === 0) {
        throw new InfrastructureError('Invalid solar forecast day');
      }
      days.add(day.data);
      for (const hour of day.hores) {
        const time = hour.data_hora;
        const value = hour.previsio_solar_kwh;
        if (typeof time !== 'string' || !time.startsWith(day.data + 'T') ||
            !moment(time, moment.ISO_8601, true).isValid() ||
            typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          throw new InfrastructureError('Invalid solar forecast hour');
        }
        // The API already returns energy in kWh: no irradiance conversion or second predictor.
        points.push({ time, value });
      }
    }
    for (const date = moment(startDate); date.format('YYYY-MM-DD') <= endDate; date.add(1, 'day')) {
      if (!days.has(date.format('YYYY-MM-DD'))) {
        throw new InfrastructureError('Solar forecast does not cover the requested dates');
      }
    }
    return points.sort((a, b) => a.time.localeCompare(b.time));
  }
}
