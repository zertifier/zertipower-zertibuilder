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
import * as moment from "moment";
import { ErrorCode } from "src/shared/domain/error";
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

  @Get('/community/:communityId/date/:from/:to')
  // @Auth(RESOURCE_NAME)
  async getByDateAndCommunity(@Param('communityId') communityId: string, @Param('from') from: string, @Param('to') to: string) {
    const query =
      `
    SELECT
    trades.id, 
    action, 
    traded_kwh, 
    cost, 
    previous_kwh, 
    current_kwh, 
    trades.info_dt, 
    trades.from_cups_id, 
    from_cups.customer_id AS from_customer_id,
    from_users.wallet_address AS from_wallet_address,
    trades.to_cups_id, 
    to_cups.customer_id AS to_customer_id,
    to_users.wallet_address AS to_wallet_address
    FROM 
        trades
    LEFT JOIN 
        cups AS from_cups ON trades.from_cups_id = from_cups.id 
    LEFT JOIN 
        users AS from_users ON from_cups.customer_id = from_users.customer_id
    LEFT JOIN 
        cups AS to_cups ON trades.to_cups_id = to_cups.id
    LEFT JOIN 
        users AS to_users ON to_cups.customer_id = to_users.customer_id
    WHERE 
        from_cups.community_id = ${communityId}
        AND DATE(trades.info_dt) BETWEEN '${from}' AND '${to}'
    ORDER BY 
        trades.info_dt DESC, trades.id;
    `;

    try {
      const [ROWS]: any[] = await this.conn.query(query);
      const mappedData = ROWS.map(this.mapData)
      return HttpResponse.success('trades fetched successfully').withData(mappedData);
    } catch (error) {
      console.log(error)
      return HttpResponse.failure('error fetching trades', ErrorCode.INTERNAL_ERROR)
    }

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

    // const query = `
    //   SELECT trades.id, action, traded_kwh, cost, previous_kwh, current_kwh, info_dt, from_cups_id, to_cups_id, cups.customer_id
    //   FROM trades
    //          LEFT JOIN cups ON trades.from_cups_id = cups.id
    //   WHERE cups.customer_id = ${customerId}
    //     AND DATE(trades.info_dt) BETWEEN '${from}' AND '${to}'
    //   ORDER BY info_dt DESC, trades.id  
    // `

    const query =
      `
        SELECT trades.id,
               action,
               traded_kwh,
               cost,
               previous_kwh,
               current_kwh,
               trades.info_dt,
               trades.from_cups_id,
               from_cups.customer_id     AS from_customer_id,
               from_users.wallet_address AS from_wallet_address,
               trades.to_cups_id,
               to_cups.customer_id       AS to_customer_id,
               to_users.wallet_address   AS to_wallet_address
        FROM trades
               LEFT JOIN
             cups AS from_cups ON trades.from_cups_id = from_cups.id
               LEFT JOIN
             users AS from_users ON from_cups.customer_id = from_users.customer_id
               LEFT JOIN
             cups AS to_cups ON trades.to_cups_id = to_cups.id
               LEFT JOIN
             users AS to_users ON to_cups.customer_id = to_users.customer_id
        WHERE from_cups.customer_id = ${customerId}
          AND DATE(trades.info_dt) BETWEEN '${from}' AND '${to}'
        ORDER BY trades.info_dt DESC, trades.id;
      `;

    try {
      const [ROWS]: any[] = await this.conn.query(query);
      const mappedData = ROWS.map(this.mapData)
      return HttpResponse.success('trades fetched successfully').withData(mappedData);
    } catch (error) {
      console.log(error)
      return HttpResponse.failure('error fetching trades', ErrorCode.INTERNAL_ERROR)
    }
  }


  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT 
      id,
      info_dt, 
      from_cups_id, 
      to_cups_id, 
      action, 
      traded_kwh, 
      cost, 
      previous_kwh, 
      current_kwh 
      FROM trades
      `
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id
    mappedData.action = data.action
    mappedData.tradedKwh = data.traded_kwh
    mappedData.cost = data.cost
    mappedData.previousKwh = data.previous_kwh
    mappedData.currentKwh = data.current_kwh
    mappedData.infoDt = moment(data.info_dt, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
    mappedData.fromCupsId = data.from_cups_id
    mappedData.toCupsId = data.to_cups_id
    mappedData.fromCustomerId = data.from_customer_id
    mappedData.fromWalletAddress = data.from_wallet_address
    mappedData.toCustomerId = data.to_customer_id
    mappedData.toWalletAddress = data.to_wallet_address
    // mappedData.energyHourlyFromId = data.energy_hourly_from_id
    // mappedData.energyHourlyToId = data.energy_hourly_to_id
    // mappedData.createdDt = data.created_dt
    // mappedData.updatedDt = data.updated_dt

    return mappedData;
  }

}
