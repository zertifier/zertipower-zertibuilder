import { weatherChartList } from '../../services/weather-chart-adapter';
import {Controller, Get, Query} from '@nestjs/common';
import {WeatherPredictionService} from "../../services/weather-prediction.service";
import {HttpResponse} from 'src/shared/infrastructure/http/HttpResponse';

@Controller('weather-prediction')
export class WeatherPredictionController {
  constructor(private weatherPredictionService: WeatherPredictionService) {
  }

  @Get()
  public async getPrediction(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string
  ): Promise<HttpResponse> {
    const latitude = lat ? parseFloat(lat) : 42.1822177;
    const longitude = lon ? parseFloat(lon) : 2.4890211;

    const prediction = await this.weatherPredictionService.getPrediction(latitude, longitude);
    return HttpResponse.success("Weather fetched successfully").withData({ ...prediction, source: 'Open-Meteo', list: weatherChartList(prediction) });
  }

  @Get('historical')
  public async getHistoricalWeather(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string
  ): Promise<HttpResponse> {
    const prediction = await this.weatherPredictionService.getHistoricalWeather(
      parseFloat(lat),
      parseFloat(lon),
      startDate,
      endDate
    );
    return HttpResponse.success("Historical weather fetched successfully").withData(prediction);
  }
}
