import { BadRequestException, Injectable, BadGatewayException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as moment from 'moment-timezone';

export interface RoofInput { areaM2?: number; panelCount?: number; latitude: number; longitude: number; kwp: number; tilt: number; azimuth: number; }
export function validateRoof(input: RoofInput): RoofInput {
  const limits: Record<'latitude' | 'longitude' | 'kwp' | 'tilt' | 'azimuth', [number, number]> = { latitude: [-90, 90], longitude: [-180, 180], kwp: [0.001, 10000], tilt: [0, 90], azimuth: [-180, 180] };
  const result = {} as RoofInput;
  for (const name of Object.keys(limits) as (keyof typeof limits)[]) {
    const bounds = limits[name];
    const value = input?.[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < bounds[0] || value > bounds[1]) throw new BadRequestException('Invalid roof parameter: ' + name);
    result[name] = value;
  }
  if (input.areaM2 !== undefined || input.panelCount !== undefined) {
    if (typeof input.areaM2 !== 'number' || !Number.isFinite(input.areaM2) || input.areaM2 <= 0 ||
        !Number.isSafeInteger(input.panelCount) || input.panelCount! <= 0) {
      throw new BadRequestException('Invalid calculator area or panel count');
    }
    result.areaM2 = input.areaM2;
    result.panelCount = input.panelCount;
  }
  return result;
}

export function integrateRoof(input: RoofInput, times: number[], radiation: (number | null)[], start: string, end: string) {
  if (!Array.isArray(times) || !Array.isArray(radiation) || times.length !== radiation.length) throw new BadGatewayException('Invalid radiation response');
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  const seen = new Set<number>();
  const hourly: { time: string; value: number }[] = [];
  for (let i = 0; i < times.length; i++) {
    const timestamp = times[i];
    if (!Number.isSafeInteger(timestamp) || timestamp % 3600 !== 0) throw new BadGatewayException('Invalid radiation timestamp');
    // Open-Meteo GTI is the preceding hour mean: allocate energy to the interval start.
    const date = moment.unix(timestamp - 3600).tz('Europe/Madrid');
    const day = date.format('YYYY-MM-DD');
    if (day < start || day > end) continue;
    if (seen.has(timestamp)) throw new BadGatewayException('Duplicate radiation interval');
    seen.add(timestamp);
    const irradiance = radiation[i];
    if (irradiance == null || !Number.isFinite(irradiance) || irradiance < 0) throw new BadGatewayException('Incomplete radiation forecast');
    // GTI already includes tilt and azimuth. W/m² mean × 1 h / 1000 = kWh/m².
    // Normalize to STC 1 kW/m² and apply the declared system performance ratio once.
    const energy = input.kwp * irradiance / 1000 * 0.8;
    hourly.push({ time: date.format(), value: energy });
    sums.set(day, (sums.get(day) ?? 0) + energy);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const daily: { date: string; kwh: number }[] = [];
  for (const day = moment.tz(start, 'Europe/Madrid'); day.format('YYYY-MM-DD') <= end; day.add(1, 'day')) {
    const key = day.format('YYYY-MM-DD');
    const hours = day.clone().add(1, 'day').diff(day, 'hours');
    if (counts.get(key) !== hours) throw new BadGatewayException('Incomplete day: ' + key);
    daily.push({ date: key, kwh: Number(sums.get(key)!.toFixed(2)) });
  }
  return { input, daily, hourly, performanceRatio: 0.8, source: 'Open-Meteo', model: 'calculator-gti-v1', radiationUnit: 'W/m²', productionUnit: 'kWh', timezone: 'Europe/Madrid',
    assumptions: ['No local shading or dirt model', 'No inverter clipping or historical calibration'] };
}

@Injectable()
export class RoofSimulationService {
  private readonly logger = new Logger(RoofSimulationService.name);

  forecastWindow() {
    const today = moment.tz('Europe/Madrid').startOf('day');
    return { start: today.clone().format('YYYY-MM-DD'), end: today.clone().add(5, 'days').format('YYYY-MM-DD') };
  }

  async simulate(raw: RoofInput, window = this.forecastWindow()) {
    const input = validateRoof(raw);
    const { start, end } = window;
    let data: any;
    try {
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', { timeout: 30000, params: {
        latitude: input.latitude, longitude: input.longitude, tilt: input.tilt, azimuth: input.azimuth,
        hourly: 'global_tilted_irradiance', timezone: 'Europe/Madrid', timeformat: 'unixtime',
        start_date: start, end_date: moment.tz(end, 'Europe/Madrid').add(1, 'day').format('YYYY-MM-DD'),
      } });
      data = response.data;
    } catch { throw new BadGatewayException('Open-Meteo is unavailable. Please retry.'); }
    if (data?.hourly_units?.global_tilted_irradiance !== 'W/m²' || data?.hourly_units?.time !== 'unixtime') {
      throw new BadGatewayException('Unexpected Open-Meteo radiation or time units');
    }
    const result = integrateRoof(input, data?.hourly?.time, data?.hourly?.global_tilted_irradiance, start, end);
    this.logger.log(JSON.stringify({ model: result.model, kwp: input.kwp, tilt: input.tilt,
      azimuth: input.azimuth, performanceRatio: result.performanceRatio, start, end,
      dailyKwh: result.daily.map(day => day.kwh) }));
    return result;
  }
}
