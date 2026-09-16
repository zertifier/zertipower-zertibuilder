import { AuthServicesModule } from '../auth/infrastructure/services/auth-services.module';
import { UserRepositoriesModule } from '../users/infrastructure/repositories/user-repositories.module';
import { LocalConsumptionService } from './infrastructure/services/local-consumption.service';
import { CommunitySolarRoofStoreService } from './infrastructure/services/community-solar-roof-store.service';
import { CommunityRoofSimulationService } from './infrastructure/services/community-roof-simulation.service';
import { RoofSimulationService } from './infrastructure/services/roof-simulation.service';
import { RoofSimulationController } from './infrastructure/controllers/roof-simulation.controller';
import { Module } from '@nestjs/common';
import { EnergyPredictionController } from './infrastructure/controllers/energy-prediction/energy-prediction.controller';
import { EnergyForecastService } from './infrastructure/services/energy-forecast.service';
import {SharedServicesModule} from "../../shared/infrastructure/services/shared-services.module";
import { ConsumptionPredictionService } from './infrastructure/services/consumption-prediction.service';
import { HistoricalDataExtractionService } from './infrastructure/services/historical-data-extraction.service';
import { WeatherPredictionModule } from '../weather-prediction/weather-prediction.module';
import { HistoricalDataController } from './infrastructure/controllers/historical-data/historical-data.controller';
import { UserPredictionIntegrationService } from './infrastructure/services/user-prediction-integration.service';
import { UserPredictionController } from './infrastructure/controllers/user-prediction/user-prediction.controller';
import { MontolivetPredictionService } from './infrastructure/services/montolivet-prediction.service';
import { MontolivetPredictionController } from './infrastructure/controllers/montolivet-prediction/montolivet-prediction.controller';
import { CalculadoraIntegrationService } from './infrastructure/services/calculadora-integration.service';
import { CalculadoraSyncController } from './infrastructure/controllers/calculadora-sync/calculadora-sync.controller';
import { CommunityMemberRoofsService } from './infrastructure/services/community-member-roofs.service';

@Module({
  imports: [SharedServicesModule, WeatherPredictionModule, AuthServicesModule, UserRepositoriesModule],
  controllers: [RoofSimulationController, EnergyPredictionController, HistoricalDataController, UserPredictionController, MontolivetPredictionController, CalculadoraSyncController],
  providers: [CommunityMemberRoofsService, CommunitySolarRoofStoreService, LocalConsumptionService, CommunityRoofSimulationService, RoofSimulationService, EnergyForecastService, ConsumptionPredictionService, HistoricalDataExtractionService, UserPredictionIntegrationService, MontolivetPredictionService, CalculadoraIntegrationService]
})
export class EnergyPredictionModule {}
