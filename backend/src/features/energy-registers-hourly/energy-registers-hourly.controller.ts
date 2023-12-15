import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveEnergyRegistersHourlyDto } from "./save-energy-registers-hourly-dto";
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
    private prisma: PrismaService,
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
      let query:string = '';
      if (community) {
        // Si se pasa la comunidad, obtenemos todos los cups asociados a esa comunidad.
        query = `
          SELECT eh.info_datetime, SUM(eh.import) AS import, SUM(eh.generation) AS generation
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
          SELECT eh.info_datetime, SUM(eh.import) AS import, SUM(eh.generation) AS generation
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
        day
      ]);
      registers = rows;
      return HttpResponse.success("customers fetched successfully").withData(
        registers
      );
    } catch (e) {
      console.log("error getting energy");
    }
  }

  @Get("/weekly/:week")
  @Auth(RESOURCE_NAME)
  async getWeekly(@Param("week") week: string, @Query() queryParams: any) {
    try {
      let registers: any;
      let query: string='';
      const { cups, year, wallet, community } = queryParams;
      if (community) {
        // Si se pasa la comunidad, obtenemos todos los cups asociados a esa comunidad.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
                 SUM(eh.export)            AS export,
                 SUM(eh.consumption)        AS consumption
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
          WHERE c.community_id = ?
            AND WEEK(eh.info_datetime) = ?
            AND YEAR(eh.info_datetime) = ?
          GROUP BY WEEKDAY(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      } else if (cups) {
        // Si se pasa un cups, buscamos la energía gastada por ese cups.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
            SUM(eh.export)            AS export,
            SUM(eh.consumption)        AS consumption
          FROM energy_registers_original_hourly eh
          WHERE eh.cups_id = ?
            AND WEEK(eh.info_datetime) = ?
            AND YEAR(eh.info_datetime) = ?
          GROUP BY WEEKDAY(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      } else if (wallet) {
        // Si se pasa una wallet, obtenemos todos los cups asociados a ese customer y sumamos sus gastos y generaciones.
        query = `
          SELECT DAYNAME(eh.info_datetime) AS week_day,
                 eh.info_datetime          as date,
                 SUM(eh.import)            AS import,
                 SUM(eh.generation)        AS generation,
                 SUM(eh.consumption)        AS consumption,
                 SUM(eh.export)        AS export,
          FROM energy_registers_original_hourly eh
                 LEFT JOIN cups c ON eh.cups_id = c.id
                 LEFT JOIN customers cu ON c.customer_id = cu.id
          WHERE cu.wallet_address = ?
            AND WEEK(eh.info_datetime) = ?
            AND YEAR(eh.info_datetime) = ?
          GROUP BY WEEKDAY(eh.info_datetime)
          ORDER BY eh.info_datetime`;
      }
      const [rows] = await this.conn.query(query, [
        community || cups || wallet,
        week,
        year
      ]);
      registers = rows;
      return HttpResponse.success("customers fetched successfully").withData(
        registers
      );
    } catch (e) {
      console.log("error getting energy");
    }
  }

  @Get("/monthly/:year")
  @Auth(RESOURCE_NAME)
  async getMonthly(@Param("year") year: string, @Query() queryParams: any) {
    try {
      const { cups, wallet, community } = queryParams;
      let query: string='';
      let registers: any;
      const monthsName: string[] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const yearlyRegisters = [];
      const defaultMonth = { month: "", import: 0, generation: 0 };

      if (cups) {
        query = `SELECT month, import, export, consumption, generation
                 FROM energy_registers_original_monthly
                 WHERE cups_id = ?
                   AND year = ?
                 order by month`;
      } else if (community) {
        query = `SELECT month, import, generation
                 FROM energy_registers_original_monthly
                        LEFT JOIN cups c ON cups_id = c.id
                 WHERE c.community_id = ?
                   AND year = ?
                 ORDER BY month`;
      } else if (wallet) {
        //todo
      }

      const [ROWS] = await this.conn.query(query, [
        community || cups || wallet,
        year
      ]);
      registers = ROWS;

      for (let i = 0; i < monthsName.length; i++) {
        const monthData = registers.find(
          (register: any) =>
            monthsName.indexOf(monthsName[i]) + 1 === register.month
        );
        if (monthData) {
          monthData.month = monthsName[i];
          yearlyRegisters.push(monthData);
        } else {
          defaultMonth.month = monthsName[i];
          yearlyRegisters.push({ ...defaultMonth });
        }
      }

      return HttpResponse.success("customers fetched successfully").withData(
        yearlyRegisters
      );
    } catch (e) {
      console.log("error getting energy");
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
                generation
         FROM energy_registers_hourly`
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
