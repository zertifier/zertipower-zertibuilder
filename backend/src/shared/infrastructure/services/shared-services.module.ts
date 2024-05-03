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
    MinterService
  ],
})
export class SharedServicesModule {}
