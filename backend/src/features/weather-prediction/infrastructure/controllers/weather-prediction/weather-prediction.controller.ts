import {Controller, Get} from '@nestjs/common';
import {PredictionResponse, WeatherPredictionService} from "../../services/weather-prediction.service";

@Controller('weather-prediction')
export class WeatherPredictionController {
  constructor(private weatherPredictionService: WeatherPredictionService) {
  }
  @Get()
  public async getPrediction(): Promise<PredictionResponse> {
    return this.weatherPredictionService.getPrediction();
  }
}
