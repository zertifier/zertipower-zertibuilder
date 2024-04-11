import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
} from "@nestjs/common";
import {HttpResponse} from "src/shared/infrastructure/http/HttpResponse";
import {PrismaService} from "src/shared/infrastructure/services/prisma-service/prisma-service";
import {MysqlService} from "src/shared/infrastructure/services/mysql-service/mysql.service";
import {Datatable} from "src/shared/infrastructure/services/datatable/Datatable";
import {SaveCommunitiesDTO} from "./save-communities-dto";
import * as moment from "moment";
import {ApiTags} from "@nestjs/swagger";
import {Auth} from "src/features/auth/infrastructure/decorators";
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

    let url = `SELECT communities.*, count(cups.id) as cups_number
               FROM communities
                      LEFT join cups ON community_id = communities.id
               GROUP BY communities.id`;
    const [ROWS]: any[] = await this.conn.query(url);

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
  async getByIdEnergy(@Param("id") id: number, @Param("date") date: string) {

    let url = `SELECT MONTHNAME(info_dt) as month,
                      MONTH(info_dt)     as month_number,
                      SUM(import)        AS import,
                      SUM(export)        AS export
               FROM communities
                      LEFT join cups ON community_id = communities.id
                      LEFT join datadis_energy_registers ON cups_id = cups.id
               WHERE cups.community_id = ?
                 AND YEAR(info_dt) = ?
               GROUP BY MONTH(info_dt)
    `;

    let year = moment(date, 'YYYY-MM-DD').format('YYYY').toString()

    const [ROWS]: any[] = await this.conn.query(url, [id, year]);


    return HttpResponse.success("communities fetched successfully").withData(ROWS)

  }

  @Get(":id/stats/:origin/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    let data: any = await this.prisma.$queryRaw`
      SELECT eh.*, community_id, cups.surplus_distribution
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE DATE(info_dt) = ${date}
        AND origin = ${origin}
        AND cups.community_id = ${id}
        AND cups.type != 'community'
      GROUP BY HOUR(info_dt)
      ORDER BY info_dt;
    `;


    let communityData: any = await this.prisma.$queryRaw`
      SELECT kwh_out production
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE DATE(info_dt) = ${date}
        AND origin = ${origin}
        AND cups.community_id = ${id}
        AND cups.type != 'community'
      GROUP BY HOUR(info_dt)
      ORDER BY info_dt;
    `;

    for (let i = 0; i < data.length; i++) {
      data[i].production = communityData[i].production
      data[i].production_active = data[i].production * data[i].production_active
    }


    data = this.dataWithEmpty(data, date, 24, 'daily')

    const mappedData = data.map(this.energyHourlyMapData);
    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Get(":id/stats/:origin/monthly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year, month] = date.split('-');

    let data: any = await this.prisma.$queryRaw`
      SELECT eh.*,
             SUM(kwh_in)                  AS kwh_in,
             SUM(kwh_out)                 AS kwh_out,
             SUM(kwh_out_virtual)         AS kwh_out_virtual,
             SUM(kwh_in_price)            AS kwh_in_price,
             SUM(kwh_out_price)           AS kwh_out_price,
             SUM(kwh_in_price_community)  AS kwh_in_price_community,
             SUM(kwh_out_price_community) AS kwh_out_price_community,
             SUM(cups.surplus_distribution)  production_active,
             DATE(info_dt)                AS info_dt,
             community_id
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND MONTH(info_dt) = ${parseInt(month)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
        AND cups.type != 'community'
      GROUP BY DAY(info_dt)
      ORDER BY info_dt;
    `;

    let communityData: any = await this.prisma.$queryRaw`
      SELECT SUM(kwh_out) production
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND MONTH(info_dt) = ${parseInt(month)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
        AND cups.type = 'community'
      GROUP BY DAY(info_dt)
      ORDER BY info_dt;
    `;

    for (let i = 0; i < data.length; i++) {
      data[i].production = communityData[i].production
      data[i].production_active = data[i].production * data[i].production_active
    }

    const daysOfMonth = moment(date).daysInMonth()
    data = this.dataWithEmpty(data, date, daysOfMonth, 'monthly')

    const mappedData = data.map(this.energyHourlyMapData);
    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Get(":id/stats/:origin/yearly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year] = date.split('-');

    let data: any = await this.prisma.$queryRaw`
      SELECT eh.*,
             SUM(kwh_in)                  AS kwh_in,
             SUM(kwh_out)                 AS kwh_out,
             SUM(kwh_out_virtual)         AS kwh_out_virtual,
             SUM(kwh_in_price)            AS kwh_in_price,
             SUM(kwh_out_price)           AS kwh_out_price,
             SUM(kwh_in_price_community)  AS kwh_in_price_community,
             SUM(kwh_out_price_community) AS kwh_out_price_community,
             SUM(cups.surplus_distribution)  production_active,
             DATE(info_dt)                AS info_dt,
             community_id
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
        AND cups.type != 'community'
      GROUP BY MONTH(info_dt)
      ORDER BY info_dt;
    `;

    let communityData: any = await this.prisma.$queryRaw`
      SELECT SUM(kwh_out) production
      FROM energy_hourly eh
             LEFT JOIN cups
                       ON cups_id = cups.id
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND cups.community_id = ${id}
        AND origin = ${origin}
        AND cups.type = 'community'
      GROUP BY DAY(info_dt)
      ORDER BY info_dt;
    `;

    for (let i = 0; i < data.length; i++) {
      data[i].production = communityData[i].production
      data[i].production_active = data[i].production * data[i].production_active
    }

    data = this.dataWithEmpty(data, date, 12, 'yearly')

    const mappedData = data.map(this.energyHourlyMapData);
    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCommunitiesDTO) {
    console.log("post community", body);
    const data = await this.prisma.communities.create({data: body});
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
      `SELECT com.id,
              name,
              test,
              energy_price,
              com.lat,
              com.lng,
              com.location_id,
              com.created_at,
              com.updated_at,
              loc.municipality,
              COUNT(cups.id) qty_cups
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
    mappedData.geolocation = data.geolocation;
    mappedData.energyPrice = data.energyPrice;
    mappedData.createdAt = data.createdAt;
    mappedData.updatedAt = data.updatedAt;
    return mappedData;
  }

  energyHourlyMapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.infoDt = data.infoDt || data.info_dt;
    // mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.type = data.type;
    mappedData.origin = data.origin;
    mappedData.kwhIn = data.kwhIn || data.kwh_in;
    mappedData.kwhOut = data.kwhOut || data.kwh_out;
    mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
    mappedData.kwhInPrice = data.kwhInPrice || data.kwh_in_price;
    mappedData.kwhOutPrice = data.kwhOutPrice || data.kwh_out_price;
    mappedData.kwhInPriceCommunity = data.kwhInPriceCommunity || data.kwh_in_price_community;
    mappedData.kwhOutPriceCommunity = data.kwhOutPriceCommunity || data.kwh_out_price_community;
    mappedData.communitySurplusActive = data.productionActive || data.production_active;
    mappedData.communitySurplus = data.production;
    mappedData.type = data.type;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    mappedData.communityId = data.communityId || data.community_id;
    return mappedData;
  }

  dataWithEmpty(data: any, date: string, qty: number, type: 'yearly' | 'monthly' | 'daily') {
    if (data.length < qty) {
      for (let i = 0; i < qty; i++) {
        let formattedDate;
        if (type == 'daily') {
          const hour = i.toString().length > 1 ? i : `0${i}`
          formattedDate = `${date} ${hour}:00:00`
        }

        if (type == 'monthly'){
          const day = (i+1).toString().length > 1 ? i+1 : `0${i+1}`
          formattedDate = `${date}-${day} 01:00:00`
        }

        if (type == 'yearly'){
          const month = (i+1).toString().length > 1 ? i+1 : `0${i+1}`
          formattedDate = `${date}-${month}-01 01:00:00`
        }

        const newDate = moment.utc(formattedDate).toDate()
        const sameDate = data.find((item: any) => {
          if (type == 'daily')
            return item.info_dt.toString() == newDate.toString()

          if (type == 'monthly'){
            const dayOfItem = moment(item.info_dt).format('YYYY-MM-DD')
            const dayOfNewDate = moment(newDate).format('YYYY-MM-DD')
            return dayOfItem == dayOfNewDate
          }

          if (type == 'yearly'){
            const monthOfItem = moment(item.info_dt).format('YYYY-MM')
            const monthOfNewDate = moment(newDate).format('YYYY-MM')
            return monthOfItem == monthOfNewDate
          }

          return

        });
        if (!sameDate) {
          const cupEmptyObject = {
            "id": 0,
            "cups_id": 0,
            "info_dt": newDate,
            "type": "",
            "origin": "datadis",
            "kwh_in": 0,
            "kwh_out": 0,
            "kwh_out_virtual": 0,
            "kwh_in_price": 0,
            "kwh_out_price": 0,
            "kwh_in_price_community": 0,
            "kwh_out_price_community": 0,
            "production_active": 0,
            "production": 0,
            "created_at": newDate,
            "updated_at": newDate,
            "community_id": 7
          }

          data.splice(i, 0, cupEmptyObject)
        }
      }
    }
    return data
  }
}
