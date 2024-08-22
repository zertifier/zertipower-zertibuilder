import { Module } from '@nestjs/common';
import { EnergyPredictionController } from './infrastructure/controllers/energy-prediction/energy-prediction.controller';
import { EnergyForecastService } from './infrastructure/services/energy-forecast.service';
import {SharedServicesModule} from "../../shared/infrastructure/services/shared-services.module";
import { ConsumptionPredictionService } from './infrastructure/services/consumption-prediction.service';
@Module({
  imports: [SharedServicesModule],
  controllers: [EnergyPredictionController],
  providers: [EnergyForecastService,ConsumptionPredictionService]
})
export class EnergyPredictionModule {}
