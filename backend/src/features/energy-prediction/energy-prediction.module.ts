import { Module } from '@nestjs/common';
import { EnergyPredictionController } from './infrastructure/controllers/energy-prediction/energy-prediction.controller';
import { EnergyForecastService } from './infrastructure/services/energy-forecast.service';
import {SharedServicesModule} from "../../shared/infrastructure/services/shared-services.module";

@Module({
  imports: [SharedServicesModule],
  controllers: [EnergyPredictionController],
  providers: [EnergyForecastService]
})
export class EnergyPredictionModule {}
