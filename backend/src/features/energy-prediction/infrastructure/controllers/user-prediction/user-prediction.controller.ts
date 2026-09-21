import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { UserPredictionIntegrationService } from '../../services/user-prediction-integration.service';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { ErrorCode } from '../../../../../shared/domain/error';

@Controller('user-prediction')
export class UserPredictionController {
  constructor(
    private userPredictionIntegration: UserPredictionIntegrationService,
  ) {}

  @Get('cups/:cupsId/input')
  async getProductionInput(@Param('cupsId') cupsId: string,
    @Query('start_date') startDate: string, @Query('end_date') endDate: string) {
    const data = await this.userPredictionIntegration.prepareProductionInput(Number(cupsId), startDate, endDate);
    return HttpResponse.success('Prepared input only; not sent to the predictor').withData({
      ...data, units: { production: 'kWh per hourly interval', radiation: 'W/m2', timezone: 'UTC' },
      usableHistoricalPoints: data.historicalData.filter(p => p.radiation != null).length,
      hasPositiveProduction: data.historicalData.some(p => p.production > 0),
    });
  }

  @Post('cups/:cupsId/production')
  async predictCupsProduction(
    @Param('cupsId') cupsId: string,
    @Body() body: { start_date: string; end_date: string },
  ) {
    try {
      const prediction = await this.userPredictionIntegration.predictProductionForCups(
        parseInt(cupsId),
        body.start_date,
        body.end_date,
      );
      return HttpResponse.success('Production prediction fetched successfully').withData(prediction);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error predicting production', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Post('community/:communityId/production')
  async predictCommunityProduction(
    @Param('communityId') communityId: string,
    @Body() body: { start_date: string; end_date: string },
  ) {
    try {
      const predictions = await this.userPredictionIntegration.predictProductionForCommunity(
        parseInt(communityId),
        body.start_date,
        body.end_date,
      );
      return HttpResponse.success('Community production predictions fetched successfully').withData(predictions);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error predicting community production', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Post('community/:communityId/combined')
  async getCombinedCommunityPrediction(
    @Param('communityId') communityId: string,
    @Body() body: { start_date: string; end_date: string },
  ) {
    try {
      const combinedPrediction = await this.userPredictionIntegration.getCombinedCommunityPrediction(
        parseInt(communityId),
        body.start_date,
        body.end_date,
      );
      return HttpResponse.success('Combined community prediction fetched successfully').withData(combinedPrediction);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error getting combined community prediction', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('cups/:cupsId/consumption')
  async predictCupsConsumption(
    @Param('cupsId') cupsId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const prediction = await this.userPredictionIntegration.predictConsumptionForCups(
        parseInt(cupsId),
        startDate,
        endDate,
      );
      return HttpResponse.success('Consumption prediction fetched successfully').withData(prediction);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error predicting consumption', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('community/:communityId/consumption')
  async predictCommunityConsumption(
    @Param('communityId') communityId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const prediction = await this.userPredictionIntegration.predictConsumptionForCommunity(
        parseInt(communityId),
        startDate,
        endDate,
      );
      return HttpResponse.success('Community consumption prediction fetched successfully').withData(prediction);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error predicting community consumption', ErrorCode.INTERNAL_ERROR);
    }
  }
}