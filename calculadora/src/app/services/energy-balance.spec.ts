import { calculateEnergyBalance } from './energy-balance';

describe('energy balance', () => {
  it('uses hourly min/max and preserves both physical identities', () => {
    const production = Array(12).fill(0); const consumption = Array(12).fill(0);
    production[0] = 10; consumption[0] = 8;
    const result = calculateEnergyBalance(production, consumption,
      [[6, 4], ...Array(11).fill([0, 0])], [[2, 6], ...Array(11).fill([0, 0])]);
    expect(result.source).toBe('hourly');
    expect(result.months[0]).toMatchObject({ production: 10, consumption: 8, selfConsumption: 6, export: 4, import: 2 });
    expect(result.annual.production).toBeCloseTo(result.annual.selfConsumption + result.annual.export);
    expect(result.annual.consumption).toBeCloseTo(result.annual.selfConsumption + result.annual.import);
  });

  it('marks monthly-only allocation as an estimate and never uses monthly netting', () => {
    const result = calculateEnergyBalance([100, ...Array(11).fill(0)], [10, ...Array(11).fill(0)]);
    expect(result.source).toBe('monthly-profile-estimate');
    expect(result.months[0].selfConsumption + result.months[0].export).toBeCloseTo(100);
    expect(result.months[0].selfConsumption + result.months[0].import).toBeCloseTo(10);
    expect(result.months[0].export).toBeGreaterThan(90);
  });
});
