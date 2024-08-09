import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma-service";
import { EnvironmentService } from "./environment-service";
import { MysqlService } from "./mysql-service";
import { WinstonLogger } from "./winston-logger";
import { EmailService } from "./email-service";
import { MustacheViewsService } from "./mustache-views-service";
import { EventEmitter } from "./event-emitter";
import { TextTemplateService } from "./text-template.service";
import { HandlebarsViewsService } from "./handlebars-views.service";
import { PostgresService } from "./postgres/postgres.service";
import { Datatable } from "./datatable/Datatable";
//import { PostgresDatatable } from './datatable/PostgresDatatable';
import { MysqlDatatable } from "./datatable/MysqlDatatable";
import { DatadisService } from "./datadis-service";
import { MinterService } from "./minter-service";
import { GovernanceService } from './governance/governance.service';
import { BlockchainService } from "./blockchain-service";
import { ShareService } from './share/share.service';
import { NotificationsService } from "./notifications-service";
import { EnergyHourlyService } from "./energy-houly-service";
import { LogsService } from "./logs-service";
import { CommunitiesDbRequestsService } from "src/features/communities/communities-db-requests.service";
import { CupsDbRequestsService } from "src/features/cups/cups-db-requests.service";
import { CustomersDbRequestsService } from "src/features/customers/customers-db-requests.service";
import { UsersDbRequestsService } from "src/features/users/infrastructure/user-controller/user-db-requests.service";

@Global()
@Module({
  providers: [
    PrismaService,
    EnvironmentService,
    MysqlService,
    WinstonLogger,
    EmailService,
    MustacheViewsService,
    EventEmitter,
    TextTemplateService,
    HandlebarsViewsService,
    PostgresService,
    DatadisService,
    MinterService,
    { provide: Datatable, useClass: MysqlDatatable },
    GovernanceService,
    BlockchainService,
    ShareService,
    NotificationsService,
    EnergyHourlyService,
    LogsService,
    CupsDbRequestsService,
    CustomersDbRequestsService,
    UsersDbRequestsService,
    CommunitiesDbRequestsService
  ],
  exports: [
    PrismaService,
    EnvironmentService,
    MysqlService,
    WinstonLogger,
    EmailService,
    MustacheViewsService,
    EventEmitter,
    TextTemplateService,
    HandlebarsViewsService,
    Datatable,
    DatadisService,
    MinterService,
    GovernanceService,
    BlockchainService,
    ShareService,
    NotificationsService,
    EnergyHourlyService,
    LogsService,
    CupsDbRequestsService,
    CustomersDbRequestsService,
    UsersDbRequestsService,
    CommunitiesDbRequestsService
  ],
})
export class SharedServicesModule {}
