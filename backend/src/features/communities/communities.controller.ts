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
import { UnexpectedError } from "src/shared/domain/error/common";

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

  @Get("energy/actives/:id")
  //@Auth(RESOURCE_NAME)
  async getByIdEnergyActives(@Param("id") id: number, @Param("date") date: string) {

    try{
    let url = `
        SELECT 
        COUNT(DISTINCT c.id) AS total_cups,
        COUNT(DISTINCT der.cups_id) AS total_actives
    FROM cups AS c
    LEFT JOIN datadis_energy_registers AS der ON c.id = der.cups_id
    WHERE c.community_id = ?;
    `;

    const [ROWS]: any[] = await this.conn.query(url, [id]);

    return HttpResponse.success("community active users fetched successfully").withData(ROWS);
    
    }catch(e){
      console.log(e)
      throw new UnexpectedError(e);
    }

  }

  @Get("/energy/:id/:date")
  //@Auth(RESOURCE_NAME)
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

console.log(id,year)

    const [ROWS]: any[] = await this.conn.query(url, [id, year]);


    return HttpResponse.success("communities fetched successfully").withData(ROWS)

  }

  @Get(":id/stats/:origin/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    date = `${date}%`
    let data: any = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   SUM(
                     CASE
                       WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN IFNULL(production, 0)
                       ELSE 0
                       END
                   )                              AS surplus_community_active,
                   kwh_in_price                                      AS kwh_in_price,
                   kwh_out_price                                     AS kwh_out_price,
                   kwh_in_price_community                            AS kwh_in_price_community,
                   kwh_out_price_community                           AS kwh_out_price_community,
                   CAST(COUNT(DISTINCT customer_id) AS VARCHAR(255)) AS active_members,
                   HOUR(eh.info_dt)                                  AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
            GROUP BY HOUR(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out)  AS surplus_community,
                   HOUR(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type = 'community'
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
            GROUP BY HOUR(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
    `;

    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT customer_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                    GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
      ) AS totalMembers;
    `

    date = date.slice(0, -1)

    let dataToSend = {
      totalActiveMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalActiveMembers) : 0,
      totalMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalMembers) : 0,
      stats: []
    }

    data = this.dataWithEmpty(data, date, 24, 'daily')

    const mappedData = data.map(this.energyHourlyMapData);

    dataToSend.stats = mappedData

    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      dataToSend
    );
  }

  @Get(":id/stats/:origin/monthly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year, month] = date.split('-');

    date = `${date}%`
    let data: any = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   SUM(
                     CASE
                       WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN IFNULL(production, 0)
                       ELSE 0
                       END
                   )                              AS surplus_community_active,
                   kwh_in_price                                AS kwh_in_price,
                   kwh_out_price                              AS kwh_out_price,
                   kwh_in_price_community                       AS kwh_in_price_community,
                   kwh_out_price_community                      AS kwh_out_price_community,
                   CAST(COUNT(DISTINCT customer_id) AS VARCHAR(255)) AS active_members,
                   DAY(eh.info_dt)                                   AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
            GROUP BY DAY(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out) AS surplus_community,
                   DAY(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type = 'community'
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
            GROUP BY DAY(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
    `

    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT customer_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                    GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
      ) AS totalMembers;
    `

    let dataToSend = {
      totalActiveMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalActiveMembers) : 0,
      totalMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalMembers) : 0,
      stats: []
    }

    // data = this.setProduction(data, communityData, 'monthly')
    date = date.slice(0, -1)

    const daysOfMonth = moment(date).daysInMonth()
    data = this.dataWithEmpty(data, date, daysOfMonth, 'monthly')

    const mappedData = data.map(this.energyHourlyMapData);

    dataToSend.stats = mappedData
    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      dataToSend
    );
  }

  @Get(":id/stats/:origin/yearly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year] = date.split('-');

    date = `${date}%`
    /*let data: any = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community,
             c.surplus_distribution,
             IFNULL(a.surplus_community, 0) * c.surplus_distribution surplus_community_active
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   kwh_in_price                                 AS kwh_in_price,
                   kwh_out_price                                AS kwh_out_price,
                   kwh_in_price_community                       AS kwh_in_price_community,
                   kwh_out_price_community                      AS kwh_out_price_community,
                   CAST(COUNT(DISTINCT customer_id) AS VARCHAR(255)) AS active_members,
                   MONTH(eh.info_dt)                                 AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
            GROUP BY MONTH(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out)   AS surplus_community,
                   MONTH(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type = 'community'
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
            GROUP BY MONTH(info_dt)) a
           ON a.filter_dt = b.filter_dt
             JOIN
           (SELECT SUM(surplus_distribution) surplus_distribution
            FROM (SELECT CAST(c.surplus_distribution AS DECIMAL(10, 2)) surplus_distribution
                  FROM cups c
                         LEFT JOIN
                       energy_hourly eh
                       ON cups_id = c.id
                  WHERE c.type != 'community'
                    AND eh.info_dt LIKE ${date}
                    AND c.community_id = ${id}
                  GROUP BY c.id) a) c
    `*/
    let data: any = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   SUM(
                     CASE
                       WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN IFNULL(production, 0)
                       ELSE 0
                       END
                     )                              AS surplus_community_active,
                   kwh_in_price                                 AS kwh_in_price,
                   kwh_out_price                                AS kwh_out_price,
                   kwh_in_price_community                       AS kwh_in_price_community,
                   kwh_out_price_community                      AS kwh_out_price_community,
                   CAST(COUNT(DISTINCT customer_id) AS VARCHAR(255)) AS active_members,
                   MONTH(eh.info_dt)                                 AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
            GROUP BY MONTH(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out)   AS surplus_community,
                   MONTH(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type = 'community'
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
            GROUP BY MONTH(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
    `
    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT customer_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                    GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
      ) AS totalMembers;
    `

    let dataToSend = {
      totalActiveMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalActiveMembers) : 0,
      totalMembers: totalActiveMembers.length ? parseInt(totalActiveMembers[0].totalMembers) : 0,
      stats: []
    }
    date = date.slice(0, -1)
    data = this.dataWithEmpty(data, date, 12, 'yearly')

    const mappedData = data.map(this.energyHourlyMapData);

    dataToSend.stats = mappedData

    return HttpResponse.success("communities fetched successfully").withData(
      // this.mapData(data)
      dataToSend
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
    // mappedData.communitySurplusActive = data.surplusCommunityActive || data.surplus_community_active;
    mappedData.productionActives = data.surplusCommunityActive || data.surplus_community_active;
    // mappedData.communitySurplus = data.surplusCommunity || data.surplus_community;
    mappedData.production = data.surplusCommunity || data.surplus_community;
    mappedData.activeMembers = parseInt(data.activeMembers) || parseInt(data.active_members);
    mappedData.type = data.type;
/*    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;*/
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
          if (type == 'daily' && item.info_dt)
            return item.info_dt.toString() == newDate.toString()

          if (type == 'monthly' && item.info_dt){
            const dayOfItem = moment(item.info_dt).format('YYYY-MM-DD')
            const dayOfNewDate = moment(newDate).format('YYYY-MM-DD')
            return dayOfItem == dayOfNewDate
          }

          if (type == 'yearly' && item.info_dt){
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
            "active_members": 0,
            "created_at": newDate,
            "updated_at": newDate,
          }

          data.splice(i, 0, cupEmptyObject)
        }
      }
    }
    return data
  }

  setProduction(cupsData: any, communityData: any, type: 'yearly' | 'monthly' | 'daily'){
    let dateFormat = 'YYYY-MM-DD HH:mm:ss'
    if (type == "monthly") dateFormat = 'YYYY-MM-DD'
    if (type == "yearly") dateFormat = 'YYYY-MM'

    for (const cups of cupsData) {
      let production = communityData.find((community: {production: number, info_dt: Date}) => {
        if (moment(community.info_dt).format(dateFormat) == moment(cups.info_dt).format(dateFormat)) return community
      })


      if (!production) production = 0
      else production = production.production
console.log(cups.surplus_distribution, 'cups.surplus_distribution')

      cups.production = production
      cups.production_active  = production * parseFloat(cups.surplus_distribution)

    }

    return cupsData
  }
}
