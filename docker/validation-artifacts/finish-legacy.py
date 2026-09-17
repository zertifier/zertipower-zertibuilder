from pathlib import Path
root=Path(__file__).resolve().parents[2]
base=root/'backend/src/features/energy-prediction/infrastructure/services'
(base/'community-roof-simulation.service.ts').write_text('''import { Injectable } from '@nestjs/common';
import { CommunityPredictionService } from './community-prediction.service';

/** Compatibility endpoint: all community production uses explicitly selected calculator roofs. */
@Injectable()
export class CommunityRoofSimulationService {
  constructor(private prediction: CommunityPredictionService) {}

  async simulate(communityId: number) {
    const result = await this.prediction.details(communityId);
    return { ...result, roofsSimulated: result.selectedRoofs,
      status: result.selectedRoofs ? 'complete' : 'no-calculator-roofs' };
  }
}
''')
p=base/'calculator-solar.spec.ts'
s=p.read_text();start=s.index("  it('simulates and sums all roofs, independent of member configurations'")
s=s[:start]+'''  it('routes the legacy community endpoint through selected roofs only', async () => {
    const details = { selectedRoofs: 2, forecast: [{ time: '2026-09-18T12:00:00+02:00', value: 24 }] };
    const prediction = { details: jest.fn().mockResolvedValue(details) };
    const result = await new CommunityRoofSimulationService(prediction as any).simulate(7);
    expect(prediction.details).toHaveBeenCalledWith(7);
    expect(result).toEqual({ ...details, roofsSimulated: 2, status: 'complete' });
  });
});
''';p.write_text(s)
old=root/'sql/migrations/004_consumption_history_index.sql'
if old.exists():old.rename(root/'sql/migrations/005_consumption_history_index.sql')
print('Legacy solar endpoint now delegates to selected-roof prediction; migration order corrected.')
