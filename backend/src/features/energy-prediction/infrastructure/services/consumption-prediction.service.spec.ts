jest.mock('../../../../shared/infrastructure/services', () => ({ EnvironmentService: class {} }));
import { ConsumptionPredictionService } from './consumption-prediction.service';

describe('consumption prediction units', () => {
  it.each(['getCupsConsumption', 'getCommunityConsumption'] as const)('preserves kWh above 500 in %s', async method => {
    const service = new ConsumptionPredictionService({ getEnv: () => ({ ENERGY_PREDICTION_API: 'https://example.invalid' }) } as any);
    const data = [{ date: '2026-09-21', consumption: 600 }, { date: '2026-09-22', consumption: 499 }];
    (service as any).httpClient = { get: jest.fn().mockResolvedValue({ data }) };
    expect(await service[method](7, '2026-09-21', '2026-09-26')).toEqual(data);
  });
});
