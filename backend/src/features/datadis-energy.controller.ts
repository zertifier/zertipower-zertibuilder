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
  import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
  import { DatadisService } from "src/shared/infrastructure/services";
  import mysql from "mysql2/promise";
import { MysqlService } from "../shared/infrastructure/services";
  
  export const RESOURCE_NAME = "datadisEnergy";
  
  @ApiTags(RESOURCE_NAME)
  @Controller("datadisEnergy")
  export class DatadisEnergyController {

    private conn: mysql.Pool;

    constructor(
        private prisma: PrismaService, 
        private datatable: Datatable, 
        private datadisService:DatadisService,
        private mysql: MysqlService
        ) {
        this.conn = this.mysql.pool;
    }
  
    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
      const data = await this.prisma.datadis_energy_registers.findMany();
      return HttpResponse.success("cups fetched successfully").withData(data);
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
      const data = await this.prisma.datadis_energy_registers.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success("datadis energy register fetched successfully").withData(data);
    }

    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: any) {
      const data = await this.prisma.datadis_energy_registers.create({ data: body });
      return HttpResponse.success("datadis energy register saved successfully").withData(data);
    }
  
    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: any) {
      const data = await this.prisma.datadis_energy_registers.updateMany({
        where: {
          id: parseInt(id),
        },
        data: body,
      });
      return HttpResponse.success("datadis energy register updated successfully").withData(data);
    }
  
    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
      const data = await this.prisma.datadis_energy_registers.delete({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success("datadis energy register removed successfully").withData(data);
    }
  
    @Post("datatable")
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
      const data = await this.datatable.getData(body,`SELECT * FROM datadis_energy_registers`);
      return HttpResponse.success("Datatables fetched successfully").withData(data);
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
            SELECT eh.info_dt,
                    SUM(eh.import)      AS import,
                    SUM(eh.export)      AS export
            FROM datadis_energy_registers eh
                    LEFT JOIN cups c ON eh.cups_id = c.id
            WHERE c.community_id = ?
                AND DATE(eh.info_dt) = ?
            GROUP BY eh.info_dt
            ORDER BY eh.info_dt`;
        } else if (cups) {
            // Si se pasa un cups, buscamos la energía gastada por ese cups.
            query = `
            SELECT eh.info_dt,
                    eh.import      AS import,
                    eh.export      AS export
            FROM datadis_energy_registers eh
            WHERE eh.cups_id = ?
                AND DATE(eh.info_dt) = ?
            ORDER BY eh.info_dt`;
        } else if (wallet) {
            // Si se pasa una wallet, obtenemos todos los cups asociados a ese customer y sumamos sus gastos y generaciones.
            query = `
            SELECT eh.info_dt,
                    SUM(eh.import)      AS import,
                    SUM(eh.export)      AS export
            FROM datadis_energy_registers eh
                    LEFT JOIN cups c ON eh.cups_id = c.id
                    LEFT JOIN customers cu ON c.customer_id = cu.id
            WHERE cu.wallet_address = ?
                AND DATE(eh.info_dt) = ?
            GROUP BY eh.info_dt
            ORDER BY eh.info_dt`;
        }

        const [rows] = await this.conn.query(query, [
            community || cups || wallet,
            day,
        ]);
        registers = rows;
        return HttpResponse.success("day energy fetched successfully").withData(
            registers
        );
        } catch (e) {
        console.log("error getting day energy",e);
        }
    }

    @Get("/weekly/:date")
    @Auth(RESOURCE_NAME)
    async getWeekly(@Param("date") date: string, @Query() queryParams: any) {
      try {
        let registers: any;
        let query: string = "";
        const { cups, wallet, community } = queryParams;
        if (community) {
          // Si se pasa la comunidad, obtenemos todos los cups asociados a esa comunidad.
          query = `
            SELECT DAYNAME(eh.info_dt) AS week_day,
                   eh.info_datetime          as date,
                   SUM(eh.import)            AS import,
                   SUM(eh.export)            AS export
            FROM datadis_energy_registers eh
                   LEFT JOIN cups c ON eh.cups_id = c.id
            WHERE c.community_id = ?
              AND YEARWEEK(?,1)
            GROUP BY WEEKDAY(eh.info_dt)
            ORDER BY eh.info_dt`;
        } else if (cups) {
          // Si se pasa un cups, buscamos la energía gastada por ese cups.
          query = `
            SELECT DAYNAME(eh.info_dt) AS week_day,
                   eh.info_dt          as date,
                   SUM(eh.import)            AS import,
                   SUM(eh.export)            AS export
            FROM datadis_energy_registers eh
            WHERE eh.cups_id = ?
              AND YEARWEEK(?,1)
            GROUP BY WEEKDAY(eh.info_dt)
            ORDER BY eh.info_dt`;
        } else if (wallet) {
          // Si se pasa una wallet, obtenemos todos los cups asociados a ese customer y sumamos sus gastos y generaciones.
          query = `
            SELECT DAYNAME(eh.info_dt) AS week_day,
                   eh.info_dt          as date,
                   SUM(eh.import)            AS import,
                   SUM(eh.export)            AS export,
            FROM datadis_energy_registers eh
                   LEFT JOIN cups c ON eh.cups_id = c.id
                   LEFT JOIN customers cu ON c.customer_id = cu.id
            WHERE cu.wallet_address = ?
            AND YEARWEEK(?,1)
            GROUP BY WEEKDAY(eh.info_dt)
            ORDER BY eh.info_dt`;
        }
        const [rows] = await this.conn.query(query, [
          community || cups || wallet,
          date
        ]);
        console.log("WEEK",rows)
        registers = rows;
        return HttpResponse.success("week energy fetched successfully").withData(
          registers
        );
      } catch (e) {
        console.log("error getting week energy",e);
      }
    }

    @Get("/monthly/:year")
    @Auth(RESOURCE_NAME)
    async getMonthly(@Param("year") year: string, @Query() queryParams: any) {
      try {
        const { cups, wallet, community } = queryParams;
  
        let query: string = "";
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
          "December",
        ];
        const yearlyRegisters = [];
        const defaultMonth = { month: "", import: 0, export: 0 };
  
        if (cups) {
            query = `
            SELECT 
            MONTH(eh.info_dt) AS month,
            SUM(eh.import)       AS import,
            SUM(eh.export)       AS export
            FROM datadis_energy_registers eh
            WHERE eh.cups_id = ?
            AND YEAR(eh.info_dt) = ?
            GROUP BY month
            ORDER BY month
            `;
        } else if (community) {
            //TODO:
        } else if (wallet) {
            //TODO:
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
  
        return HttpResponse.success("months energy fetched successfully").withData(
          yearlyRegisters
        );
      } catch (e) {
        console.log("error getting month energy",e);
      }
    }


}