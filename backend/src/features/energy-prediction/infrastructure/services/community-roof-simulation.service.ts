import { Injectable } from '@nestjs/common';
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
