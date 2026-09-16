import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import axios from "axios";

export interface OpenMeteoHourlyData {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  weather_code: (number | null)[];
  cloud_cover: (number | null)[];
  wind_speed_10m: (number | null)[];
  direct_radiation: (number | null)[];
  diffuse_radiation: (number | null)[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    weather_code: string;
    cloud_cover: string;
    wind_speed_10m: string;
    direct_radiation: string;
    diffuse_radiation: string;
  };
  hourly: OpenMeteoHourlyData;
}

@Injectable()
export class WeatherPredictionService {
  private readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  public async getPrediction(lat: number = 42.1822177, lon: number = 2.4890211, startDate?: string, endDate?: string): Promise<OpenMeteoResponse> {
    console.log(`🌤️ [OPEN METEO] Fetching weather forecast for coordinates: ${lat}, ${lon}`);
    console.log(`🌤️ [OPEN METEO] API URL: ${this.BASE_URL}`);

    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Invalid weather coordinates');
    const response = await axios.get<OpenMeteoResponse>(this.BASE_URL, {
      timeout: 30000,
      params: {
        latitude: lat,
        longitude: lon,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'weather_code',
          'cloud_cover',
          'wind_speed_10m',
          'direct_radiation',
          'diffuse_radiation'
        ].join(','),
        ...(startDate && endDate ? { start_date: startDate, end_date: endDate } : { forecast_days: 7 }),
        timezone: 'UTC'
      }
    });

    console.log(`✅ [OPEN METEO] Weather data received:`, {
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timezone: response.data.timezone,
      dataPoints: response.data.hourly?.time?.length || 0,
    });

    return response.data;
  }

  public async getHistoricalWeather(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<OpenMeteoResponse> {
    if (!moment.utc(startDate, 'YYYY-MM-DD', true).isValid() || !moment.utc(endDate, 'YYYY-MM-DD', true).isValid() || startDate > endDate || endDate >= moment.utc().format('YYYY-MM-DD')) throw new Error('Invalid historical weather dates');
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error('Invalid weather coordinates');
    const response = await axios.get<OpenMeteoResponse>('https://archive-api.open-meteo.com/v1/archive', {
      timeout: 30000,
      params: {
        latitude: lat,
        longitude: lon,
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'weather_code',
          'cloud_cover',
          'wind_speed_10m',
          'direct_radiation',
          'diffuse_radiation'
        ].join(','),
        start_date: startDate,
        end_date: endDate,
        timezone: 'UTC'
      }
    });
    return response.data;
  }
}
