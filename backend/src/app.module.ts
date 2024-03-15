import { SmartContractsController } from "src/features/smart-contracts/smart-contracts.controller";
import { ProvidersController } from "src/features/providers/providers.controller";
import { EnergyRegistersController } from "src/features/energy-registers/energy-registers.controller";
import { EnergyTransactionsController } from "src/features/energy-transactions/energy-transactions.controller";
import { EnergyBlocksController } from "src/features/energy-blocks/energy-blocks.controller";
import { CustomersController } from "src/features/customers/customers.controller";
import { CupsController } from "src/features/cups.controller";
import { CommunitiesController } from "src/features/communities/communities.controller";
import { CalendarController } from "src/features/calendar/calendar.controller";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { UserModule } from "./features/users/user.module";
import { AuthModule } from "./features/auth/auth.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { SharedServicesModule } from "./shared/infrastructure/services/shared-services.module";
import { ScheduleModule } from "@nestjs/schedule";
import { UserRolesRepositoriesModule } from "./features/roles/infrastructure/repositories/userRolesRepositoriesModule";
import { UserRolesControllersModule } from "./features/roles/infrastructure/controllers/userRolesControllersModule";
import { UserRolesActionsModule } from "./features/roles/application/user-roles-actions.module";
import { UserRepositoriesModule } from "./features/users/infrastructure/repositories/user-repositories.module";
import { ReportsModule } from "./features/reports/infrastructure/reports.module";
import { AuthServicesModule } from "./features/auth/infrastructure/services/auth-services.module";
import { AuthRepositoriesModule } from "./features/auth/infrastructure/repositories/auth-repositories.module";
import { LoggerMiddleware } from "./logger.middleware";
import { EnergyRegistersHourlyController } from "./features/energy-registers-hourly/energy-registers-hourly.controller";
import { EnergyAreasController } from "./features/energy-areas.controller";
import { LocationsController } from "./features/locations.controller";
import { LogsController } from "./features/logs.controller";
import { DatadisEnergyController } from "./features/datadis-energy.controller";

@Module({
  imports: [
    UserModule,
    AuthModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    SharedServicesModule,
    UserRolesRepositoriesModule,
    UserRolesControllersModule,
    UserRolesActionsModule,
    UserRepositoriesModule,
    ReportsModule,
    AuthServicesModule,
    AuthRepositoriesModule,
  ],
  // Do not remove controllers section cuz zertibuilder
  // can create it if it doesn't exist
  controllers: [
    CalendarController,
    CommunitiesController,
    CupsController,
    CustomersController,
    EnergyBlocksController,
    EnergyTransactionsController,
    EnergyRegistersController,
    EnergyRegistersHourlyController,
    ProvidersController,
    SmartContractsController,
    EnergyAreasController,
    LocationsController,
    LogsController,
    DatadisEnergyController
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
