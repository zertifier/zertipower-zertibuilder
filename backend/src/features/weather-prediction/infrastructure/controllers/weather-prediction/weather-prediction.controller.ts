import { Controller, Get } from '@nestjs/common';
import { PredictionResponse, WeatherPredictionService } from "../../services/weather-prediction.service";
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';

@Controller('weather-prediction')
export class WeatherPredictionController {
  constructor(private weatherPredictionService: WeatherPredictionService) {
  }
  // A simple comment
  @Get()
  public async getPrediction(): Promise<HttpResponse> {
    const response = HttpResponse.success("Weather fetched successfully").withData(
      this.weatherPredictionService.getPrediction()
    );

    return response
  }
}
