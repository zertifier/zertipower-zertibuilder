import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { WeatherPredictionService } from '../../../weather-prediction/infrastructure/services/weather-prediction.service';
import { CalculadoraIntegrationService } from './calculadora-integration.service';
import * as moment from 'moment-timezone';

export interface HistoricalProductionData {
  timestamp: string;
  production: number;
  radiation?: number;
  temperature?: number;
  cloudCover?: number;
}

export interface SolarInstallationConfig {
  cupsId: number;
  lat: number;
  lng: number;
  kwp: number;
  potencia_inversor_kw: number;
  graus: number;
  performance_ratio: number;
  orientacio?: string;
  azimut?: number;
}

@Injectable()
export class HistoricalDataExtractionService {
  constructor(
    private prisma: PrismaService,
    private weatherService: WeatherPredictionService,
    private calculadoraIntegration: CalculadoraIntegrationService,
  ) {}

  async getHistoricalProductionData(
    cupsId: number,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalProductionData[]> {
    if (!Number.isSafeInteger(cupsId) || cupsId <= 0 ||
        !moment.utc(startDate, 'YYYY-MM-DD', true).isValid() ||
        !moment.utc(endDate, 'YYYY-MM-DD', true).isValid() || startDate > endDate ||
        moment.utc(endDate).diff(moment.utc(startDate), 'days') > 12000) throw new Error('Invalid historical range or CUPS ID');
    const productionData = await this.prisma.energyHourly.findMany({
      where: {
        cupsId: cupsId,
        infoDt: {
          gte: moment.utc(startDate).startOf('day').toDate(),
          lte: moment.utc(endDate).endOf('day').toDate(),
        },
        production: {
          not: null,
        },
      },
      select: {
        infoDt: true,
        production: true,
      },
      orderBy: {
        infoDt: 'asc',
      },
    });

    return productionData.filter(record => record.infoDt != null && record.production != null && Number.isFinite(record.production) && record.production >= 0).map((record) => ({
      timestamp: record.infoDt?.toISOString() || '',
      production: record.production || 0,
    }));
  }

  async getHistoricalProductionWithWeather(
    cupsId: number,
    startDate: string,
    endDate: string,
    lat: number,
    lng: number,
  ): Promise<HistoricalProductionData[]> {
    const productionData = await this.getHistoricalProductionData(
      cupsId,
      startDate,
      endDate,
    );

    if (!productionData.length) return [];
    const weatherData = await this.weatherService.getHistoricalWeather(
      lat,
      lng,
      startDate,
      endDate,
    );

    const weatherMap = new Map<string, any>();
    if (weatherData.hourly && weatherData.hourly.time) {
      for (let i = 0; i < weatherData.hourly.time.length; i++) {
        const time = weatherData.hourly.time[i];
        weatherMap.set(time, {
          radiation: weatherData.hourly.direct_radiation?.[i] != null && weatherData.hourly.diffuse_radiation?.[i] != null
            ? weatherData.hourly.direct_radiation[i]! + weatherData.hourly.diffuse_radiation[i]! : undefined,
          temperature: weatherData.hourly.temperature_2m?.[i],
          cloudCover: weatherData.hourly.cloud_cover?.[i],
        });
      }
    }

    return productionData.map((record) => {
      const hourTimestamp = moment.utc(record.timestamp).format('YYYY-MM-DDTHH:mm');
      const weather = weatherMap.get(hourTimestamp);
      
      return {
        ...record,
        radiation: weather?.radiation,
        temperature: weather?.temperature,
        cloudCover: weather?.cloudCover,
      };
    });
  }

  async getCommunityHistoricalData(
    communityId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ cupsId: number; data: HistoricalProductionData[] }[]> {
    const cups = await this.prisma.cups.findMany({
      where: {
        communityId: communityId,
        type: 'community',
      },
      select: {
        id: true,
        lat: true,
        lng: true,
      },
    });

    const results = await Promise.all(
      cups.map(async (cupsItem) => {
        const config = await this.getSolarInstallationConfig(cupsItem.id);
        if (!config) throw new Error('Missing CUPS configuration');
        const data = await this.getHistoricalProductionWithWeather(
          cupsItem.id,
          startDate,
          endDate,
          config.lat,
          config.lng,
        );
        return {
          cupsId: cupsItem.id,
          data,
        };
      }),
    );

    return results;
  }

  async getCommunityProductionHistory(communityId: number, startDate: string, endDate: string) {
    const cups = await this.prisma.cups.findMany({ where: { communityId, type: 'community' }, select: { id: true } });
    return Promise.all(cups.map(async cup => ({ cupsId: cup.id, data: await this.getHistoricalProductionData(cup.id, startDate, endDate) })));
  }

  async getSolarInstallationConfig(cupsId: number): Promise<SolarInstallationConfig | null> {
    const config = await this.calculadoraIntegration.getSolarConfigFromCalculadora(cupsId);
    if (!config) return null;
    return { cupsId, lat: config.lat, lng: config.lng, kwp: config.kwp,
      potencia_inversor_kw: config.potencia_inversor_kw, graus: config.inclination,
      performance_ratio: config.performance_ratio, azimut: config.orientation };
  }
}
