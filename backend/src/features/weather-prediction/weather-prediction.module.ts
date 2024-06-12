import { Module } from '@nestjs/common';
import { WeatherPredictionService } from './infrastructure/services/weather-prediction.service';
import { WeatherPredictionController } from './infrastructure/controllers/weather-prediction/weather-prediction.controller';

@Module({
  providers: [WeatherPredictionService],
  controllers: [WeatherPredictionController]
})
export class WeatherPredictionModule {}
