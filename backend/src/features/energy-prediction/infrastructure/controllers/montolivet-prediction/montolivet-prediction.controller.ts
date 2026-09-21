import { Controller, Get, Query } from '@nestjs/common';
import { MontolivetPredictionService } from '../../services/montolivet-prediction.service';
import { HttpResponse } from '../../../../../shared/infrastructure/http/HttpResponse';
import { ErrorCode } from '../../../../../shared/domain/error';

@Controller('montolivet')
export class MontolivetPredictionController {
  constructor(
    private montolivetPredictionService: MontolivetPredictionService,
  ) {}

  @Get('status')
  async getMontolivetStatus() {
    try {
      const installations = await this.montolivetPredictionService.getMontolivetInstallations();
      return HttpResponse.success('Montolivet status fetched successfully').withData({
        system: 'Zertipower Prediction Module',
        version: '1.0.0',
        weatherApi: 'Open Meteo (https://api.open-meteo.com/v1/forecast)',
        predictionApi: process.env.ENERGY_PREDICTION_API || 'Not configured',
        communityId: installations.communityId,
        coordinates: installations.installations.length > 0 ? {
          lat: installations.installations[0].lat,
          lng: installations.installations[0].lng,
        } : null,
        totalInstallations: installations.totalInstallations,
        activeInstallations: installations.activeInstallations,
        configMethod: 'Hierarchical: Calculadora → .env → Defaults',
        lastUpdate: new Date().toISOString(),
      });
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error getting Montolivet status', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('prediction')
  async getMontolivetPrediction(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    try {
      const prediction = await this.montolivetPredictionService.getMontolivetPrediction(
        startDate,
        endDate,
      );
      return HttpResponse.success('Montolivet prediction fetched successfully').withData(prediction);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error getting Montolivet prediction', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('installations')
  async getMontolivetInstallations() {
    try {
      const installations = await this.montolivetPredictionService.getMontolivetInstallations();
      return HttpResponse.success('Montolivet installations fetched successfully').withData(installations);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error getting Montolivet installations', ErrorCode.INTERNAL_ERROR);
    }
  }

  @Get('historical')
  async getMontolivetHistoricalData(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const historicalData = await this.montolivetPredictionService.getMontolivetHistoricalData(
        startDate,
        endDate,
      );
      return HttpResponse.success('Montolivet historical data fetched successfully').withData(historicalData);
    } catch (error: any) {
      return HttpResponse.failure(error.message || 'Error getting Montolivet historical data', ErrorCode.INTERNAL_ERROR);
    }
  }
}