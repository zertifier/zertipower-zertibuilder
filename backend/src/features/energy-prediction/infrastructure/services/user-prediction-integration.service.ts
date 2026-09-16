import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EnvironmentService } from '../../../../shared/infrastructure/services';
import { HistoricalDataExtractionService, SolarInstallationConfig, HistoricalProductionData } from './historical-data-extraction.service';
import { WeatherPredictionService } from '../../../weather-prediction/infrastructure/services/weather-prediction.service';
import { EnergyForecastService } from './energy-forecast.service';
import * as moment from 'moment-timezone';

export interface UserPredictionRequest {
  cupsId: number;
  config: SolarInstallationConfig;
  historicalData: HistoricalProductionData[];
  weatherForecast: any;
  startDate: string;
  endDate: string;
}

export interface UserPredictionResponse {
  cupsId: number;
  prediction: any;
  timestamp: string;
}

@Injectable()
export class UserPredictionIntegrationService {
  static readonly HISTORICAL_VALIDATION_MODE = true;
  private httpClient = axios.create({
    baseURL: this.environment.getEnv().ENERGY_PREDICTION_API,
    timeout: 30000,
  });

  constructor(
    private environment: EnvironmentService,
    private historicalDataExtraction: HistoricalDataExtractionService,
    private weatherService: WeatherPredictionService,
    private energyForecast: EnergyForecastService,
  ) {}

  async predictProductionForCups(
    cupsId: number,
    startDate: string,
    endDate: string,
  ): Promise<UserPredictionResponse> {
    this.validateRange(startDate, endDate);
    const config = await this.historicalDataExtraction.getSolarInstallationConfig(cupsId);
    if (!config) throw new Error('CUPS configuration not found');
    const history = await this.historicalDataExtraction.getHistoricalProductionData(cupsId, '2000-01-01', startDate);
    if (!history.length) throw new Error(`No historical production for CUPS ${cupsId} before ${startDate}`);
    const prediction = await this.energyForecast.getProductionForecast({
      latitud: config.lat, longitud: config.lng, kwp: config.kwp,
      potencia_inversor_kw: config.potencia_inversor_kw, graus: config.graus,
      performance_ratio: config.performance_ratio, azimut: config.azimut,
    }, startDate, endDate);
    return { cupsId, prediction: { data: prediction }, timestamp: new Date().toISOString() };
  }

  async prepareProductionInput(cupsId: number, startDate: string, endDate: string): Promise<UserPredictionRequest> {
    if (!moment.utc(startDate, 'YYYY-MM-DD', true).isValid() ||
        !moment.utc(endDate, 'YYYY-MM-DD', true).isValid() || startDate > endDate ||
        moment.utc(endDate).diff(moment.utc(startDate), 'days') > 6) throw new Error('Provide a valid forecast range of at most seven days');
    const config = await this.historicalDataExtraction.getSolarInstallationConfig(cupsId);
    if (!config) throw new Error('CUPS configuration not found');
    // Archive data may lag. Never use future production as training data.
    const cutoff = moment.min(moment.utc(startDate).subtract(1, 'day'), moment.utc().subtract(5, 'days'));
    const historicalData = await this.historicalDataExtraction.getHistoricalProductionWithWeather(
      cupsId, cutoff.clone().subtract(29, 'days').format('YYYY-MM-DD'), cutoff.format('YYYY-MM-DD'), config.lat, config.lng);
    const weatherForecast = await this.weatherService.getPrediction(config.lat, config.lng, startDate, endDate);
    return { cupsId, config, historicalData, weatherForecast, startDate, endDate };
  }

  async predictProductionForCommunity(
    communityId: number,
    startDate: string,
    endDate: string,
  ): Promise<UserPredictionResponse[]> {
    this.validateRange(startDate, endDate);
    const historical = await this.historicalDataExtraction.getCommunityProductionHistory(communityId, '2000-01-01', startDate);
    const results: UserPredictionResponse[] = [];
    for (const member of historical) {
      if (!member.data.length) continue;
      const prediction = await this.predictProductionForCups(member.cupsId, startDate, endDate);
      results.push(prediction);
    }
    return results;
  }

  async getActualCommunityProduction(communityId: number, startDate: string, endDate: string) {
    const rows = await this.historicalDataExtraction.getCommunityHistoricalData(communityId, startDate, endDate);
    const totals = new Map<string, number>();
    rows.forEach(row => row.data.forEach(point => {
      const day = moment.utc(point.timestamp).format('YYYY-MM-DD');
      totals.set(day, (totals.get(day) || 0) + point.production);
    }));
    return [...totals].map(([date, value]) => ({ date, productionKwh: Number(value.toFixed(2)) }));
  }

  async predictProductionForCommunityWithFallback(communityId: number, forceHistorical = false) {
    const today = moment.utc().format('YYYY-MM-DD');
    const currentStart = moment.utc(today).add(1, 'day').format('YYYY-MM-DD');
    const currentEnd = moment.utc(today).add(6, 'days').format('YYYY-MM-DD');
    try {
      if (forceHistorical) throw new Error('Historical validation mode enabled');
      const current = await this.predictProductionForCommunity(communityId, currentStart, currentEnd);
      if (current.length) return { mode: 'current', referenceDate: null, predictions: current };
    } catch { /* fall through to archived validation period */ }
    const rows = await this.historicalDataExtraction.getCommunityProductionHistory(communityId, '2000-01-01', today);
    const days = new Set(rows.flatMap(row => row.data.map(point => moment.utc(point.timestamp).format('YYYY-MM-DD'))));
    const candidates = [...days].filter(day => moment.utc(day).isBefore(moment.utc(today).subtract(6, 'days'))).sort().reverse();
    for (const referenceDate of candidates) {
      const start = moment.utc(referenceDate).add(1, 'day').format('YYYY-MM-DD');
      const end = moment.utc(referenceDate).add(6, 'days').format('YYYY-MM-DD');
      const actual = await this.getActualCommunityProduction(communityId, start, end);
      if (actual.length < 6) continue;
      const predictions = await this.predictProductionForCommunity(communityId, start, end);
      if (predictions.length) return { mode: 'historical-backtest', referenceDate, predictions, actual };
    }
    throw new Error('No current or valid historical production period found');
  }

  private validateRange(startDate: string, endDate: string) {
    if (!moment.utc(startDate, 'YYYY-MM-DD', true).isValid() || !moment.utc(endDate, 'YYYY-MM-DD', true).isValid() ||
      startDate > endDate || moment.utc(endDate).diff(moment.utc(startDate), 'days') !== 5) {
      throw new Error('Prediction range must contain exactly six calendar days');
    }
  }

  async getCombinedCommunityPrediction(
    communityId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ time: string; value: number }[]> {
    const predictions = await this.predictProductionForCommunity(communityId, startDate, endDate);

    if (predictions.length === 0) {
      throw new Error('No predictions available for community');
    }

    const timePoints = new Map<string, number>();
    
    predictions.forEach(({ prediction }) => {
      if (prediction.data && Array.isArray(prediction.data)) {
        prediction.data.forEach((point: { time: string; value: number }) => {
          const currentValue = timePoints.get(point.time) || 0;
          timePoints.set(point.time, currentValue + point.value);
        });
      }
    });

    return Array.from(timePoints, ([time, value]) => ({ time, value }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async predictConsumptionForCups(
    cupsId: number,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `/cups/${cupsId}/consumption?start_date=${startDate}&end_date=${endDate}`,
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error predicting consumption for CUPS ${cupsId}:`, error.response?.data || error.message);
      throw new Error(`Failed to predict consumption for CUPS ${cupsId}`);
    }
  }

  async predictConsumptionForCommunity(
    communityId: number,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `/communities/${communityId}/consumption?start_date=${startDate}&end_date=${endDate}`,
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error predicting consumption for community ${communityId}:`, error.response?.data || error.message);
      throw new Error(`Failed to predict consumption for community ${communityId}`);
    }
  }
}
