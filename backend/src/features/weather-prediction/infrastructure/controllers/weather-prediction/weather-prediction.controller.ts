import {Controller, Get} from '@nestjs/common';
import {WeatherPredictionService} from "../../services/weather-prediction.service";
import {HttpResponse} from 'src/shared/infrastructure/http/HttpResponse';

@Controller('weather-prediction')
export class WeatherPredictionController {
  constructor(private weatherPredictionService: WeatherPredictionService) {
  }
  // A simple comment
  @Get()
  public async getPrediction(): Promise<HttpResponse> {
    const prediction = await this.weatherPredictionService.getPrediction()
    return HttpResponse.success("Weather fetched successfully").withData(prediction)
  }
}
