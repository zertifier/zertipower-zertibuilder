import axios from 'axios';
import * as moment from 'moment-timezone';
import { integrateRoof, RoofSimulationService, validateRoof } from './roof-simulation.service';
import { CommunityRoofSimulationService } from './community-roof-simulation.service';
import { CommunityMemberRoofsService } from './community-member-roofs.service';

jest.mock('axios');
const window = { start: '2026-09-16', end: '2026-09-16' };
const times = (day: string, hours: number) => Array.from({ length: hours }, (_, i) =>
  moment.tz(day, 'Europe/Madrid').unix() + (i + 1) * 3600);
const input = { latitude: 42.18, longitude: 2.48, kwp: 5, tilt: 30, azimuth: -90 };

describe('calculator solar physics', () => {
  it.each([['2026-09-16', 24], ['2026-03-29', 23], ['2026-10-25', 25]])('integrates %s', (day, hours) => {
    const t = times(String(day), Number(hours));
    expect(integrateRoof(input, t, t.map(() => 500), String(day), String(day)).daily[0].kwh).toBe(Number(hours) * 2);
  });

  it('validates values and rejects incomplete, duplicate or shifted intervals', () => {
    expect(validateRoof(input)).toEqual(input);
    for (const invalid of [{ tilt: 91 }, { kwp: 0 }, { azimuth: null }]) expect(() => validateRoof({ ...input, ...invalid } as any)).toThrow();
    const t = times(window.start, 24);
    expect(() => integrateRoof(input, t.slice(1), t.slice(1).map(() => 500), window.start, window.end)).toThrow();
    expect(() => integrateRoof(input, [...t, t[0]], [...t.map(() => 500), 500], window.start, window.end)).toThrow();
    expect(() => integrateRoof(input, t.map(value => value + 60), t.map(() => 500), window.start, window.end)).toThrow();
  });

  it('passes GTI plane parameters once and checks Open-Meteo units', async () => {
    const get = axios.get as jest.Mock;
    get.mockResolvedValue({ data: { hourly_units: { time: 'unixtime', global_tilted_irradiance: 'W/m²' },
      hourly: { time: times(window.start, 24), global_tilted_irradiance: Array(24).fill(500) } } });
    const result = await new RoofSimulationService().simulate(input, window);
    expect(result.daily).toEqual([{ date: window.start, kwh: 48 }]);
    expect(get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ params: expect.objectContaining({ tilt: 30, azimuth: -90 }) }));
    get.mockResolvedValue({ data: { hourly_units: { time: 'unixtime', global_tilted_irradiance: 'MJ/m²' }, hourly: { time: [], global_tilted_irradiance: [] } } });
    await expect(new RoofSimulationService().simulate(input, window)).rejects.toThrow('units');
  });
});

describe('calculator roofs and community aggregation', () => {
  it('loads every area for the community location and reproduces calculator formula', async () => {
    const prisma = {
      communities: { findUnique: jest.fn().mockResolvedValue({ id: 7, locationId: 3 }) },
      energyArea: { findMany: jest.fn().mockResolvedValue([
        { id: 1, reference: 'a', m2: 60, geojsonFeature: JSON.stringify({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1.5, 41.5], [1.5001, 41.5], [1.5001, 41.5001], [1.5, 41.5]]] } }) },
        { id: 2, reference: 'b', m2: 30, geojsonFeature: JSON.stringify({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1.51, 41.51], [1.5101, 41.51], [1.5101, 41.5101], [1.51, 41.51]]] } }) },
      ]) },
      energyAreaCoordinates: { findMany: jest.fn() },
    };
    const result = await new CommunityMemberRoofsService(prisma as any).getCalculatorRoofs(7);
    expect(result.roofs).toHaveLength(2);
    expect(result.energyAreasInLocation).toBe(2);
    expect(result.calculatorSelectableRoofs).toBe(2);
    expect(result.roofs.every(roof => roof.areaM2 > 0 && roof.kwp === Number((roof.areaM2 * 0.8 / 6).toFixed(1)))).toBe(true);
    expect(result.roofs.every(roof => roof.panelCount === Math.ceil(roof.kwp / 0.45))).toBe(true);
    expect(result.totalRoofAreaM2).toBeCloseTo(result.roofs.reduce((sum, roof) => sum + roof.areaM2, 0));
    expect(result.totalInstalledPowerKwp).toBeCloseTo(result.roofs.reduce((sum, roof) => sum + roof.kwp, 0));
    expect(prisma.energyArea.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { locationId: 3 } }));
    expect(prisma.energyAreaCoordinates.findMany).not.toHaveBeenCalled();
  });

  it('excludes location areas that the calculator cannot select as polygons', async () => {
    const prisma = {
      communities: { findUnique: jest.fn().mockResolvedValue({ id: 7, locationId: 3 }) },
      energyArea: { findMany: jest.fn().mockResolvedValue([
        { id: 1, reference: 'polygon', m2: 999, geojsonFeature: JSON.stringify({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1.5, 41.5], [1.5001, 41.5], [1.5001, 41.5001], [1.5, 41.5]]] } }) },
        { id: 2, reference: 'point', m2: 999, geojsonFeature: JSON.stringify({ type: 'Feature', geometry: { type: 'Point', coordinates: [1.5, 41.5] } }) },
        { id: 3, reference: 'invalid', m2: 999, geojsonFeature: null },
      ]) },
      energyAreaCoordinates: { findMany: jest.fn() },
    };
    const result = await new CommunityMemberRoofsService(prisma as any).getCalculatorRoofs(7);
    expect(result.energyAreasInLocation).toBe(3);
    expect(result.calculatorSelectableRoofs).toBe(1);
    expect(result.roofs.map(roof => roof.energyAreaId)).toEqual([1]);
  });

  it('routes the legacy community endpoint through selected roofs only', async () => {
    const details = { selectedRoofs: 2, forecast: [{ time: '2026-09-18T12:00:00+02:00', value: 24 }] };
    const prediction = { details: jest.fn().mockResolvedValue(details) };
    const result = await new CommunityRoofSimulationService(prediction as any).simulate(7);
    expect(prediction.details).toHaveBeenCalledWith(7);
    expect(result).toEqual({ ...details, roofsSimulated: 2, status: 'complete' });
  });
});
