import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import { ErrorCode } from "../../shared/domain/error";
import mysql from "mysql2/promise";
import { MysqlService } from "../../shared/infrastructure/services";

export const RESOURCE_NAME = "energyRegistersHourly";

@ApiTags(RESOURCE_NAME)
@Controller("energy-registers-hourly")
export class EnergyRegistersHourlyController {
  private conn: mysql.Pool;


  constructor(
    private datatable: Datatable,
    private mysql: MysqlService
  ) {
    this.conn = this.mysql.pool;
  }

  @Get("/hourly/:day")
  @Auth(RESOURCE_NAME)
  async getHourly(@Param("day") day: string, @Query() queryParams: any) {
    try {
      let registers: any;
      const { cups, year, wallet, community } = queryParams;
      let query: string = "";
      if (community) {
        // Si se pasa la comunidad, obtenemos todos los cups asociados a esa comunidad.
        query = `
          SELECT eh.info_datetime,
                 SUM(eh.import)      AS import,
                 SUM(eh.generation)  AS generation,
                 SUM(eh.consumption) AS consumption,
                 SUM(eh.export)      AS export
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
          WHERE c.community_id = ?
            AND DATE(eh.info_datetime) = ?
          GROUP BY eh.info_datetime
          ORDER BY eh.info_datetime`;
      } else if (cups) {
        // Si se pasa un cups, buscamos la energía gastada por ese cups.
        query = `
          SELECT eh.info_datetime,
                 eh.import      AS import,
                 eh.generation  AS generation,
                 eh.export      AS export,
                 eh.consumption AS consumption
          FROM energy_registers_original_hourly eh
          WHERE eh.cups_id = ?
            AND DATE(eh.info_datetime) = ?
          ORDER BY eh.info_datetime`;
      } else if (wallet) {
        // Si se pasa una wallet, obtenemos todos los cups asociados a ese customer y sumamos sus gastos y generaciones.
        query = `
          SELECT eh.info_datetime,
                 SUM(eh.import)      AS import,
                 SUM(eh.generation)  AS generation,
                 SUM(eh.consumption) AS consumption,
                 SUM(eh.export)      AS export
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
                 LEFT JOIN customers cu ON c.customer_id = cu.id
          WHERE cu.wallet_address = ?
            AND DATE(eh.info_datetime) = ?
          GROUP BY eh.info_datetime
          ORDER BY eh.info_datetime`;
      }

      const [rows] = await this.conn.query(query, [
        community || cups || wallet,
        day,
      ]);
      registers = rows;
      return HttpResponse.success("customers fetched successfully").withData(
        registers
      );
    } catch (e) {
      console.log("error getting energy",e);
    }
  }

  @Get("/weekly/:date")
  @Auth(RESOURCE_NAME)
  async getWeekly(@Param("date") date: string, @Query() queryParams: any) {
    
    try {

      let query: string = "";
      const { cups, year, wallet, community } = queryParams;

      await this.conn.query(`SET @@lc_time_names = 'ca_ES'`);

      const [firstDayRow]:any = await this.conn.execute('SELECT DATE_SUB(?, INTERVAL WEEKDAY(?) DAY) AS first_day', [date, date]);
      const firstDay = firstDayRow[0].first_day;

      const [lastDayRow]:any = await this.conn.execute('SELECT DATE_ADD(?, INTERVAL 6 DAY) AS last_day', [firstDay]);
      const lastDay = lastDayRow[0].last_day;

      console.log(firstDay,lastDay)

      if (community) {
        // Si se pasa la comunidad, obtenemos todos los cups asociados a esa comunidad.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
                 SUM(eh.export)            AS export,
                 SUM(eh.consumption)       AS consumption
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
          WHERE c.community_id = ?
          AND eh.info_datetime BETWEEN ? AND ?
          GROUP BY DAYNAME(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      } else if (cups) {
        // Si se pasa un cups, buscamos la energía gastada por ese cups.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
                 SUM(eh.export)            AS export,
                 SUM(eh.consumption)       AS consumption
          FROM energy_registers_original_hourly eh
          WHERE eh.cups_id = ?
          AND eh.info_datetime BETWEEN ? AND ?
          GROUP BY DAYNAME(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      } else if (wallet) {
        // Si se pasa una wallet, obtenemos todos los cups asociados a ese customer y sumamos sus gastos y generaciones.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
                 SUM(eh.consumption)       AS consumption,
                 SUM(eh.export)            AS export,
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
                 LEFT JOIN customers cu ON c.customer_id = cu.id
          WHERE cu.wallet_address = ?
          AND eh.info_datetime BETWEEN ? AND ?
          GROUP BY DAYNAME(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      }
      const [rows] = await this.conn.query(query, [
        community || cups || wallet,
        firstDay,lastDay
      ]);

      console.log(rows)

      return HttpResponse.success("customers fetched successfully").withData(
        rows
      );
    } catch (e) {
      console.log("error getting energy",e);
    }
  }

  @Get("/monthly/:year")
  @Auth(RESOURCE_NAME)
  async getMonthly(@Param("year") year: string, @Query() queryParams: any) {
    try {
      const { cups, wallet, community } = queryParams;
      let query: string = "";
      await this.conn.query(`SET @@lc_time_names = 'ca_ES'`);

      if (cups) {
        query = `SELECT 
                    MONTHNAME(STR_TO_DATE(month, '%m')) AS month_name,
                    month AS month_number, 
                    SUM(import) AS import, 
                    SUM(export) AS export, 
                    SUM(consumption) AS consumption, 
                    SUM(generation) AS generation
                 FROM energy_registers_original_monthly
                 WHERE cups_id = ?
                   AND year = ?
                   group by month_number
                 order by month_number`;
      } else if (community) {
        //TODO:
      } else if (wallet) {
        //TODO:
      }

      const [ROWS] = await this.conn.query(query, [
        community || cups || wallet,
        year,
      ]);

      return HttpResponse.success("customers fetched successfully").withData(
        ROWS
      );
    } catch (e) {
      console.log("error getting energy",e);
    }
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    try {
      const data = await this.datatable.getData(
        body,
        `SELECT info_datetime,
                cups_id,
                import,
                consumption,
                export,
                generation,
                cups
         FROM energy_registers_original_hourly erh
                LEFT JOIN cups ON cups.id = cups_id`
      );
      return HttpResponse.success("Datatables fetched successfully").withData(
        data
      );
    } catch (e) {
      console.log("Error datatables: ", e);
      return HttpResponse.failure(
        "error getting datatables data",
        ErrorCode.UNEXPECTED
      );
    }
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.cupsId = data.cupsId;
    mappedData.infoDatetime = data.infoDatetime;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.generation = data.generation;
    return mappedData;
  }
}
