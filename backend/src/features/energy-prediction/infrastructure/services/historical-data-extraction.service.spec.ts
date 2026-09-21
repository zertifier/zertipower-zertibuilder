import { HistoricalDataExtractionService } from './historical-data-extraction.service';

describe('Historical production and weather alignment', () => {
  it('matches UTC minute timestamps, preserves zero and leaves missing radiation undefined', async () => {
    const prisma = { energyHourly: { findMany: jest.fn().mockResolvedValue([
      { infoDt: new Date('2025-08-01T09:00:00Z'), production: 2 },
      { infoDt: new Date('2025-08-01T10:00:00Z'), production: 0 },
    ]) } };
    const weather = { getHistoricalWeather: jest.fn().mockResolvedValue({ hourly: {
      time: ['2025-08-01T09:00', '2025-08-01T10:00'],
      direct_radiation: [300, null], diffuse_radiation: [50, 10],
      temperature_2m: [20, 21], cloud_cover: [0, 5],
    } }) };
    const service = new HistoricalDataExtractionService(prisma as any, weather as any, {} as any);
    const points = await service.getHistoricalProductionWithWeather(46, '2025-08-01', '2025-08-01', 42, 2);
    expect(points[0]).toMatchObject({ production: 2, radiation: 350 });
    expect(points[1].production).toBe(0);
    expect(points[1].radiation).toBeUndefined();
  });
  it('does not request weather when the database has no production observations', async () => {
    const weather = { getHistoricalWeather: jest.fn() };
    const service = new HistoricalDataExtractionService({ energyHourly: { findMany: jest.fn().mockResolvedValue([]) } } as any, weather as any, {} as any);
    expect(await service.getHistoricalProductionWithWeather(46, '2025-08-01', '2025-08-01', 42, 2)).toEqual([]);
    expect(weather.getHistoricalWeather).not.toHaveBeenCalled();
  });
});
