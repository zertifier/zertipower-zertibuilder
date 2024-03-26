import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveCommunitiesDTO } from "./save-communities-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";

export const RESOURCE_NAME = "communities";


@ApiTags(RESOURCE_NAME)
@Controller("communities")
export class CommunitiesController {

  private conn: mysql.Pool;
  constructor(private prisma: PrismaService, private datatable: Datatable, private mysql: MysqlService) {
    this.conn = this.mysql.pool;
  }

  @Get()
  async get() {

      let url = `SELECT communities.*, count(cups.id) as cups_number FROM communities LEFT join cups ON community_id = communities.id GROUP BY communities.id`;
    const [ROWS]:any[] = await this.conn.query(url);

    return HttpResponse.success("communities fetched successfully").withData(
      ROWS
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.communities.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("communities fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Get("/energy/:id/:date")
  @Auth(RESOURCE_NAME)
  async getByIdEnergy(@Param("id") id: number,@Param("date") date: string) {
    
    let url = `SELECT MONTHNAME(info_dt) as month,
    MONTH(info_dt) as month_number,
    SUM(import)      AS import,                 
    SUM(export)      AS export
    FROM communities 
    LEFT join cups ON community_id = communities.id 
    LEFT join datadis_energy_registers ON cups_id = cups.id
    WHERE cups.community_id = ?
    AND YEAR(info_dt) =  ?
    GROUP BY MONTH(info_dt)
    `;

    let year = moment(date,'YYYY-MM-DD').format('YYYY').toString()

    const [ROWS]:any[] = await this.conn.query(url,[id,year]);
    
    
    return HttpResponse.success("communities fetched successfully").withData(ROWS)
    
  }

  @Get(":id/:origin/stats/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT er.*, community_id
      FROM energy_registers er
      LEFT JOIN cups
      ON cups_id = cups.id
      WHERE DATE(info_dt) = ${date}
        AND origin = ${origin}
        AND cups.community_id = ${id}
      ORDER BY info_dt;
    `;

    const mappedData = data.map(this.energyRegistersMapData);
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Get(":id/:origin/stats/monthly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year, month] = date.split('-');

    const data: any = await this.prisma.$queryRaw`
      SELECT er.*,  
             SUM(generation) AS generation,
             SUM(import) AS import,
             SUM(export) AS export,
             SUM(consumption) AS consumption,
             SUM(community_generation) AS community_generation,
             SUM(virtual_generation) AS virtual_generation,
             DATE(info_dt) AS info_dt, 
             community_id
      FROM energy_registers er
      LEFT JOIN cups
        ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND MONTH(info_dt) = ${parseInt(month)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
      GROUP BY DAY(info_dt)
      ORDER BY info_dt;
    `;

    const mappedData = data.map(this.energyRegistersMapData);
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Get(":id/:origin/stats/yearly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year] = date.split('-');

    const data: any = await this.prisma.$queryRaw`
      SELECT er.*,  
             SUM(generation) AS generation, 
             SUM(import) AS import, 
             SUM(export) AS export, 
             SUM(consumption) AS consumption, 
             SUM(community_generation) AS community_generation, 
             SUM(virtual_generation) AS virtual_generation, 
             DATE(info_dt) AS info_dt,
             community_id
      FROM energy_registers er
      LEFT JOIN cups
        ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
      GROUP BY MONTH(info_dt)
      ORDER BY info_dt;
    `;

    const mappedData = data.map(this.energyRegistersMapData);
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCommunitiesDTO) {
    console.log("post community", body);
    const data = await this.prisma.communities.create({ data: body });
    return HttpResponse.success("communities saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveCommunitiesDTO) {
    const data = await this.prisma.communities.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("communities updated successfully").withData(
      data
    );
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.communities.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("communities removed successfully").withData(
      data
    );
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT com.id,name,test,energy_price,com.lat,com.lng,com.location_id,com.created_at,com.updated_at, loc.municipality, COUNT(cups.id) qty_cups
                  FROM communities com
                  LEFT JOIN locations loc ON loc.id = com.location_id
                  LEFT JOIN cups ON com.id = community_id
                  GROUP BY com.id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.name = data.name;
    mappedData.test = data.test;
    mappedData.geolocation=data.geolocation;
    mappedData.energyPrice=data.energyPrice;
    mappedData.createdAt = data.createdAt;
    mappedData.updatedAt = data.updatedAt;
    return mappedData;
  }

  energyRegistersMapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.infoDt = data.infoDt || data.info_dt;
    // mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.type = data.type;
    mappedData.origin = data.origin;
    mappedData.communityGeneration = data.communityGeneration || data.community_generation;
    mappedData.virtualGeneration = data.virtualGeneration || data.virtual_generation;
    mappedData.generation = data.generation;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    mappedData.communityId = data.communityId || data.community_id;
    return mappedData;
  }
}
