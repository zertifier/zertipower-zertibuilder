from pathlib import Path
root=Path(__file__).resolve().parents[2]
base=root/'backend/src/features/energy-prediction/infrastructure/services'
p=base/'calculator-community-selections.service.ts';s=p.read_text()
s=s.replace('  consumptionSource?: string;', '  calculatorValues?: Record<string, number>;\n  consumptionSource?: string;')
s=s.replace('    record.consumptionSource =', '''    if (raw.calculatorValues !== undefined) {
      if (!raw.calculatorValues || typeof raw.calculatorValues !== 'object' || Array.isArray(raw.calculatorValues)) {
        throw new BadRequestException('Invalid calculator values');
      }
      record.calculatorValues = {};
      for (const key of ['valle', 'llano', 'punta', 'vallePrice', 'llanoPrice', 'puntaPrice', 'generationPrice', 'totalCost', 'yearlySavings']) {
        const value = raw.calculatorValues[key];
        if (value === undefined) continue;
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new BadRequestException('Invalid calculator value: ' + key);
        record.calculatorValues[key] = value;
      }
    }
    record.consumptionSource =''')
p.write_text(s)
p=root/'calculadora/src/app/pages/calculate/calculate.component.ts';s=p.read_text()
s=s.replace('      monthlyGenerationKwh:area.monthsGeneration, monthlyConsumptionKwh:area.monthsConsumption,', '''      monthlyGenerationKwh:area.monthsGeneration, monthlyConsumptionKwh:area.monthsConsumption,
      calculatorValues:Object.fromEntries(['valle','llano','punta','vallePrice','llanoPrice','puntaPrice','generationPrice','totalCost','yearlySavings']
        .filter(key => (area as any)[key] != null && Number.isFinite(Number((area as any)[key])))
        .map(key => [key,Number((area as any)[key])])),''')
s=s.replace('        consumptionSource:roof.consumptionSource,', '        ...roof.calculatorValues,\n        consumptionSource:roof.consumptionSource,')
p.write_text(s)
p=base/'roof-simulation.service.ts';s=p.read_text().replace("start: today.format('YYYY-MM-DD')", "start: today.clone().add(1, 'day').format('YYYY-MM-DD')");p.write_text(s)
p=root/'calculadora/src/app/pages/calculate/calculate.component.html';s=p.read_text().replace('Previsió per avui i els cinc dies següents','Previsió per demà i els cinc dies següents');p.write_text(s)
(base/'calculator-community-selections.service.spec.ts').write_text('''import { CalculatorCommunitySelectionsService } from './calculator-community-selections.service';
describe('calculator selection persistence', () => {
  const roof = { communityId: 7, energyAreaId: 3103, roofReference: 'alias', latitude: 42.18, longitude: 2.47,
    kwp: 113.7, areaM2: 853, panelCount: 253, tilt: 25, azimuth: 0,
    monthlyConsumptionKwh: Array(12).fill(251), consumptionSource: 'manual',
    calculatorValues: { valle: 71, llano: 83, punta: 97, yearlySavings: 450 } };
  let prisma: any, service: CalculatorCommunitySelectionsService;
  beforeEach(() => {
    prisma = { communities: { findUnique: jest.fn().mockResolvedValue({ locationId: 1 }) },
      energyArea: { findUnique: jest.fn().mockResolvedValue({ locationId: 1, cadastralReference: 'canonical' }) },
      $executeRawUnsafe: jest.fn().mockResolvedValue(1), $queryRawUnsafe: jest.fn() };
    service = new CalculatorCommunitySelectionsService(prisma);
  });
  it('saves without member ownership and restores manual consumption and calculator values', async () => {
    const saved = await service.save(roof);
    expect(saved.roofReference).toBe('canonical');
    const insert = prisma.$executeRawUnsafe.mock.calls.find((args: any[]) => args[0].includes('INSERT'));
    expect(insert.slice(1, 3)).toEqual([7, 3103]);
    prisma.$queryRawUnsafe.mockResolvedValue([{ configuration_json: insert[3] }]);
    const [restored] = await service.list(7);
    expect(restored.monthlyConsumptionKwh.reduce((a,b)=>a+b,0)).toBe(3012);
    expect(restored.calculatorValues).toEqual(roof.calculatorValues);
    expect(restored.consumptionSource).toBe('manual');
  });
  it('rejects roofs outside the selected community', async () => {
    prisma.energyArea.findUnique.mockResolvedValue({ locationId: 2 });
    await expect(service.save(roof)).rejects.toThrow('community location');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
  it('rejects incomplete monthly series and invalid financial values', async () => {
    await expect(service.save({ ...roof, monthlyConsumptionKwh: [1] })).rejects.toThrow('monthly');
    await expect(service.save({ ...roof, calculatorValues: { yearlySavings: NaN } })).rejects.toThrow('calculator value');
  });
});
''')
print('Persisted calculator tariff/savings values; aligned roof preview to D+1...D+6; added persistence regression tests.')
