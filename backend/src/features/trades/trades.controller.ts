import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";
export const RESOURCE_NAME = "trades";

@ApiTags(RESOURCE_NAME)
@Controller("trades")
export class TradesController {

  private conn: mysql.Pool;

  constructor(
    private prisma: PrismaService,
    private datatable: Datatable,
    private mysql: MysqlService
  ) {
    this.conn = this.mysql.pool;
  }

  @Get('/customer/:customerId/date/:from/:to')
  // @Auth(RESOURCE_NAME)
  async getByDateAndCustomer(@Param('customerId') customerId: string, @Param('from') from: string, @Param('to') to: string) {
 /*   const query = `
      SELECT trades.id, action, traded_kwh, cost, previous_kwh, current_kwh, info_dt
      FROM trades
             LEFT JOIN cups ON trades.from_cups_id = cups.id OR trades.to_cups_id = cups.id
      WHERE cups.customer_id = ${customerId}
        AND DATE(trades.info_dt) BETWEEN '${from}' AND '${to}'
      ORDER BY info_dt DESC
    `*/
    const query = `
      SELECT trades.id, action, traded_kwh, cost, previous_kwh, current_kwh, info_dt
      FROM trades
             LEFT JOIN cups ON trades.from_cups_id = cups.id
      WHERE cups.customer_id = ${customerId}
        AND DATE(trades.info_dt) BETWEEN '${from}' AND '${to}'
      ORDER BY info_dt DESC
    `
    const [ROWS]: any[] = await this.conn.query(query);
    const mappedData = ROWS.map(this.mapData)
    return HttpResponse.success('proposals fetched successfully').withData(mappedData);
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id
    mappedData.energyHourlyFromId = data.energy_hourly_from_id
    mappedData.energyHourlyToId = data.energy_hourly_to_id
    mappedData.fromCupsId = data.from_cups_id
    mappedData.toCupsId = data.to_cups_id
    mappedData.action = data.action
    mappedData.tradedKwh = data.traded_kwh
    mappedData.cost = data.cost
    mappedData.previousKwh = data.previous_kwh
    mappedData.currentKwh = data.current_kwh
    mappedData.infoDt = data.info_dt
    mappedData.createdDt = data.created_dt
    mappedData.updatedDT = data.updated_dt

    return mappedData;
  }
}
