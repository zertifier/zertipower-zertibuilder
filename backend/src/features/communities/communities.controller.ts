import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Request,
  Query,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveCommunitiesDTO, SaveDaoDTO } from "./save-communities-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";
import { UnexpectedError } from "src/shared/domain/error/common";
import { CommunityCups, CommunityCupsStats } from "./communities.interface";
import { CommunitiesStatsService } from "./communities-stats/communities-stats.service";
import { CustomersDbRequestsService } from "../customers/customers-db-requests.service";
import { UsersDbRequestsService } from "../users/infrastructure/user-controller/user-db-requests.service";
import { CommunitiesDbRequestsService } from "./communities-db-requests.service";
import { UserDTO } from "../users/infrastructure/user-controller/DTOs/UserDTO"
import { CupsDbRequestsService } from "../cups/cups-db-requests.service";
import { SaveUserDTO } from "../users/infrastructure/user-controller/DTOs/SaveUserDTO";
import { SaveCustomersDTO } from "../customers/save-customers-dto";
import { PasswordUtils } from "../users/domain/Password/PasswordUtils";
import { EnvironmentService } from "src/shared/infrastructure/services";
import { BlockchainService } from "src/shared/infrastructure/services/blockchain-service";
import { ErrorCode } from "src/shared/domain/error";
import { ModifyByTradeDTO } from "./modify-by-trade-dto";
import { Prisma } from "@prisma/client";


export const RESOURCE_NAME = "communities";

@ApiTags(RESOURCE_NAME)
@Controller("communities")
export class CommunitiesController {

  private conn: mysql.Pool;

  constructor(
    private prisma: PrismaService,
    private datatable: Datatable,
    private mysql: MysqlService,
    private statsService: CommunitiesStatsService,
    private customersDbRequestService: CustomersDbRequestsService,
    private usersDbRequestService: UsersDbRequestsService,
    private communityDbRequestService: CommunitiesDbRequestsService,
    private cupsDbRequestsService: CupsDbRequestsService,
    private environmentService: EnvironmentService,
    private blockchainService: BlockchainService
  ) {
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

  @Get("/:id/cups")
  async getCommunityCupsById(@Param("id") id: number) {
    let url = `SELECT * FROM cups WHERE community_id = ?`;
    const [ROWS]: any[] = await this.conn.query(url, [id]);
    return HttpResponse.success("communities cups fetched successfully").withData(
      ROWS
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: number) {
    if (!id) {
      return HttpResponse.failure("Missing parameter Id.", ErrorCode.MISSING_PARAMETERS)
    }
    const data = await this.prisma.communities.findUnique({
      where: {
        id: id,
      },
    });
    return HttpResponse.success("communities fetched successfully").withData(
      this.mapData(data)
    );
  }

  // @Get("/producers/:id")
  // async getProducersByCommunityId(@Param("id") id: string) {
  //   try {
  //     let url = `
  //       SELECT *
  //       FROM cups AS c
  //       WHERE c.community_id = ? AND type='prosumer' or type='community'; 
  //   `;
  //     const [ROWS]: any[] = await this.conn.query(url, [id]);
  //     return HttpResponse.success("community producers fetched successfully").withData({ cups: ROWS });
  //   } catch (e) {
  //     console.log(e)
  //     throw new UnexpectedError(e);
  //   }
  // }

  @Get("/locations/:id")
  @Auth(RESOURCE_NAME)
  async getByLocationId(@Param("id") id: string) {
    const data = await this.prisma.communities.findMany({
      where: {
        locationId: parseInt(id),
      },
    });
    return HttpResponse.success("communities fetched successfully").withData(
      data.map(this.mapData)
    );
  }

  @Get("energy/actives/:id")
  //@Auth(RESOURCE_NAME)
  async getByIdEnergyActives(@Param("id") id: number, @Param("date") date: string) {

    try {
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

    } catch (e) {
      console.log(e)
      throw new UnexpectedError(e);
    }

  }

  @Get("/energy/:id/:date")
  //@Auth(RESOURCE_NAME)
  async getByIdEnergy(@Param("id") id: number, @Param("date") date: string) {

    let importDataQuery = `SELECT MONTHNAME(info_dt) as month,
                      MONTH(info_dt)     as month_number,
                      SUM(import)        AS import
               FROM communities
                      LEFT join cups ON community_id = communities.id
                      LEFT join datadis_energy_registers ON cups_id = cups.id
               WHERE cups.community_id = ?
                 AND YEAR(info_dt) = ?
                 AND cups.type != 'community'
               GROUP BY MONTH(info_dt);
    `;

    let productionDataQuery = `SELECT MONTHNAME(info_dt) as month,
      MONTH(info_dt)     as month_number,
      SUM(export)        AS export
      FROM communities
          LEFT join cups ON community_id = communities.id
          LEFT join datadis_energy_registers ON cups_id = cups.id
      WHERE cups.community_id = ?
      AND YEAR(info_dt) = ?
      AND cups.type = 'community'
      GROUP BY MONTH(info_dt);
    `;

    let year = moment(date, 'YYYY-MM-DD').format('YYYY').toString()


    let [ROWS]: any[] = await this.conn.query(importDataQuery, [id, year]);
    let importData = ROWS;
    [ROWS] = await this.conn.query(productionDataQuery, [id, year]);
    let productionData = ROWS;

    return HttpResponse.success("communities fetched successfully").withData({ importData, productionData })

  }

  @Get(":id/stats/:origin/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string,@Query('excludeCupsIds') cupsToExclude: string) {

    let excludedCups:any = [0]

    if(cupsToExclude){
      excludedCups = cupsToExclude.split(',').map(Number);
    }

    date = `${date}%`

    let data: any = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0)))                 AS kwh_total,
                   (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) AS kwh_virtual_total,
                   100 - (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) * 100.0 /
                         (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0))) AS shared_percentage,
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
                   CAST(COUNT(DISTINCT CASE WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN customer_id END) AS VARCHAR(255)) AS active_members,
                   HOUR(eh.info_dt)                                  AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY HOUR(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out)  AS surplus_community,
                   HOUR(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE (c.type = 'community' OR c.type = 'prosumer')
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY HOUR(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
    `;

    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT cups_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                      AND (eh.kwh_in IS NOT NULL OR eh.kwh_out IS NOT NULL)
                      AND c.active = 1
                    GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
          AND c.active = 1
      ) AS totalMembers;
    `

    let communityCups: CommunityCups[] = await this.prisma.$queryRaw`
      SELECT SUM(eh.kwh_out) AS kwh_out,
             HOUR(eh.info_dt) AS filter_dt,
             eh.info_dt,
             eh.cups_id,
             c.cups,
             c.reference
      FROM energy_hourly eh
             LEFT JOIN cups c ON eh.cups_id = c.id
      WHERE c.type = 'community'
        AND eh.info_dt LIKE ${date}
        AND c.community_id = ${id}
        AND c.active = 1
      GROUP BY HOUR(eh.info_dt), eh.cups_id
      ORDER BY filter_dt;
    `

    data = this.addCommunityCups(data, communityCups)

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
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string,@Query('excludeCupsIds') cupsToExclude: string) {
    const [year, month] = date.split('-');

    let excludedCups:any = [0]

    if(cupsToExclude){
      excludedCups = cupsToExclude.split(',').map(Number);
    }

    date = `${date}%`
    let data: CommunityCupsStats[] = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                       AS kwh_in,
                   SUM(kwh_in_virtual)                              AS kwh_in_virtual,
                   SUM(eh.kwh_out)                                   AS kwh_out,
                   SUM(kwh_out_virtual)                              AS kwh_out_virtual,
                   (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0)))                 AS kwh_total,
                   (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) AS kwh_virtual_total,
                   100 - (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) * 100.0 /
                         (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0))) AS shared_percentage,
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
                   CAST(COUNT(DISTINCT CASE WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN customer_id END) AS VARCHAR(255)) AS active_members,
                   DAY(eh.info_dt)                                   AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY DAY(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out) AS surplus_community,
                   DAY(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE (c.type = 'community' OR c.type = 'prosumer')
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY DAY(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
            ORDER BY info_dt
    `
    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT cups_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                      AND (eh.kwh_in IS NOT NULL OR eh.kwh_out IS NOT NULL)
                      AND c.active = 1
                    GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
          AND c.active = 1
      ) AS totalMembers;
    `

    let communityCups: CommunityCups[] = await this.prisma.$queryRaw`
      SELECT SUM(eh.kwh_out) AS kwh_out,
             DAY(eh.info_dt) AS filter_dt,
             eh.info_dt,
             eh.cups_id,
             c.cups,
             c.reference
      FROM energy_hourly eh
             LEFT JOIN cups c ON eh.cups_id = c.id
      WHERE c.type = 'community'
        AND eh.info_dt LIKE ${date}
        AND c.community_id = ${id}
        AND c.active = 1
      GROUP BY DAY(eh.info_dt), eh.cups_id
      ORDER BY filter_dt;
    `

    data = this.addCommunityCups(data, communityCups)

    let dataToSend: any = {
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
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string,@Query('excludeCupsIds') cupsToExclude: string) {
    const [year] = date.split('-');

    date = `${date}%`

    let excludedCups:any = [0]

    if(cupsToExclude){
      excludedCups = cupsToExclude.split(',').map(Number);
    }

    let data: CommunityCupsStats[] = await this.prisma.$queryRaw`
      SELECT b.*,
             a.surplus_community
      FROM (SELECT SUM(kwh_in)                                                            AS kwh_in,
                   SUM(eh.kwh_out)                                                        AS kwh_out,
                   SUM(kwh_in_virtual)                                                    AS kwh_in_virtual,
                   SUM(kwh_out_virtual)                                                   AS kwh_out_virtual,
                   (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0)))                 AS kwh_total,
                   (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) AS kwh_virtual_total,
                   100 - (SUM(COALESCE(kwh_in_virtual, 0)) + SUM(COALESCE(kwh_out_virtual, 0))) * 100.0 /
                         (SUM(COALESCE(kwh_in, 0)) + SUM(COALESCE(kwh_out, 0))) AS shared_percentage,
                   SUM(
                     CASE
                       WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL THEN IFNULL(production, 0)
                       ELSE 0
                       END
                   )                                                                      AS surplus_community_active,
                   kwh_in_price                                                           AS kwh_in_price,
                   kwh_out_price                                                          AS kwh_out_price,
                   kwh_in_price_community                                                 AS kwh_in_price_community,
                   kwh_out_price_community                                                AS kwh_out_price_community,
                   CAST(COUNT(DISTINCT CASE
                                         WHEN kwh_in IS NOT NULL OR kwh_out IS NOT NULL
                                           THEN customer_id END) AS VARCHAR(255))         AS active_members,
                   MONTH(eh.info_dt)                                                      AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE c.type != 'community'
              AND eh.info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY MONTH(eh.info_dt)) b
             LEFT JOIN
           (SELECT SUM(kwh_out)   AS surplus_community,
                   MONTH(info_dt) AS filter_dt,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups c
                 ON cups_id = c.id
            WHERE (c.type = 'community' OR c.type = 'prosumer')
              AND info_dt LIKE ${date}
              AND c.community_id = ${id}
              AND origin = ${origin}
              AND c.active = 1
              AND c.id NOT IN (${Prisma.join(excludedCups)})
            GROUP BY MONTH(eh.info_dt)) a
           ON a.filter_dt = b.filter_dt
    `
    let totalActiveMembers: any = await this.prisma.$queryRaw`
      SELECT totalActiveMembers.totalActiveMembersSum totalActiveMembers, totalMembers.totalMembers
      FROM (
             SELECT SUM(totalActiveMembers) AS totalActiveMembersSum
             FROM (
                    SELECT COUNT(DISTINCT cups_id) AS totalActiveMembers
                    FROM energy_hourly eh
                           LEFT JOIN cups c ON eh.cups_id = c.id
                    WHERE c.type != 'community'
                      AND eh.info_dt LIKE ${date}
                      AND c.community_id = ${id}
                      AND (eh.kwh_in IS NOT NULL OR eh.kwh_out IS NOT NULL)
                      AND c.cups = 1
                      GROUP BY c.community_id
                  ) AS subquery1
           ) AS totalActiveMembers
             CROSS JOIN (
        SELECT COUNT(*) AS totalMembers
        FROM cups c
        WHERE community_id = ${id}
          AND TYPE != 'community'
          AND c.active = 1
      ) AS totalMembers;
    `

    let communityCups: CommunityCups[] = await this.prisma.$queryRaw`
      SELECT SUM(eh.kwh_out) AS kwh_out,
             MONTH(eh.info_dt) AS filter_dt,
             eh.info_dt,
             eh.cups_id,
             c.cups,
             c.reference
      FROM energy_hourly eh
             LEFT JOIN cups c ON eh.cups_id = c.id
      WHERE c.type = 'community'
        AND eh.info_dt LIKE ${date}
        AND c.community_id = ${id}
        AND c.active = 1
      GROUP BY MONTH(eh.info_dt), eh.cups_id
      ORDER BY filter_dt;
    `

    data = this.addCommunityCups(data, communityCups)
    let dataToSend: any = {
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

    let pk;

    try {
      //create new wallet
      if (body.walletPwd) {
        pk = body.walletPwd;
      } else {
        if (!body.name) {
          return HttpResponse.failure("a name is required", ErrorCode.MISSING_PARAMETERS)
        }
        const envVariables = this.environmentService.getEnv();
        const textToPrivate = envVariables.JWT_SECRET + body.name;
        pk = this.blockchainService.createPrivateKey(textToPrivate);
      }
      const wallet = this.blockchainService.createWalletWithPk(pk);
      const encriptedPk = await PasswordUtils.encryptData(pk, process.env.JWT_SECRET!);
      body.walletPwd = encriptedPk;
      body.walletAddress = wallet.address;

      //insert new community:
      const data: any = await this.prisma.communities.create({ data: body });

      delete data.walletPwd
      return HttpResponse.success("communities saved successfully").withData(
        data
      );

    } catch (error) {
      console.log("Error creating community", error);
      return HttpResponse.failure("error creating community", ErrorCode.INTERNAL_ERROR)
    }
  }

  @Put(":id/wallet")
  @Auth(RESOURCE_NAME)
  async createWallet(@Param("id") id: string, @Body() body: SaveCommunitiesDTO) {

    let pk;

    try {

      //get community
      const community: any = await this.prisma.communities.findUnique({
        where: {
          id: parseInt(id),
        },
      });

      if (!community) {
        return HttpResponse.failure("Community not found", ErrorCode.NOT_FOUND)
      }

      //create new wallet
      if (body.walletPwd) {
        pk = body.walletPwd;
      } else {
        if (!community.name) {
          return HttpResponse.failure("a name is required", ErrorCode.MISSING_PARAMETERS)
        }
        const envVariables = this.environmentService.getEnv();
        const textToPrivate = envVariables.JWT_SECRET + community.name;
        pk = this.blockchainService.createPrivateKey(textToPrivate);
      }

      const wallet = this.blockchainService.createWalletWithPk(pk);
      const encriptedPk = await PasswordUtils.encryptData(pk, process.env.JWT_SECRET!);
      community.walletPwd = encriptedPk;
      community.walletAddress = wallet.address;

      const data = await this.prisma.communities.update({ where: { id: parseInt(id) }, data: community });

      delete community.walletPwd;

      return HttpResponse.success("communities saved successfully").withData(
        data
      );

    } catch (error) {
      console.log("Error updating wallet community", error);
      return HttpResponse.failure("error updating community wallet", ErrorCode.INTERNAL_ERROR)
    }
  }

  @Post(':id/dao')
  @Auth(RESOURCE_NAME)
  async createDao(@Param("id") id: string, @Body() body: SaveDaoDTO) {
    const data = await this.prisma.communities.update({
      where: {
        id: parseInt(id),
      },
      data: body
    });
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

  @Put(":id/trade-types")
  @Auth(RESOURCE_NAME)
  async updateTradeAndName(@Param("id") id: string, @Body() body: ModifyByTradeDTO) {
    const data = await this.prisma.communities.updateMany({
      where: {
        id: parseInt(id),
      },
      data: {
        name: body.name,
        tradeType: body.tradeType
      },
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
    mappedData.tradeType = data.tradeType || data.trade_type;
    mappedData.daoAddress = data.daoAddress || data.dao_address;
    mappedData.daoName = data.daoName || data.dao_name;
    mappedData.daoSymbol = data.daoSymbol || data.dao_symbol;
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
    mappedData.kwhTotal = data.kwhTotal || data.kwh_total;
    mappedData.kwhInVirtual = data.kwhInVirtual || data.kwh_in_virtual;
    mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
    mappedData.kwhVirtualTotal = data.kwhVirtualTotal || data.kwh_virtual_total;
    mappedData.sharedPercentage = data.sharedPercentage || data.shared_percentage;
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
    mappedData.communitiesCups = data.communitiesCups
    return mappedData;
  }

  mapCommunityData(data: any) {
    const mappedData: any = {};
    mappedData.kwhOut = data.kwhOut || data.kwh_out;
    mappedData.infoDt = data.infoDt || data.info_dt;
    mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.tradeType = data.tradeType || data.trade_type;
    mappedData.cups = data.cups;
    mappedData.reference = data.reference;
    return mappedData
  }

  dataWithEmpty(data: any, date: string, qty: number, type: 'yearly' | 'monthly' | 'daily') {
    if (data.length < qty) {
      for (let i = 0; i < qty; i++) {
        let formattedDate;
        if (type === 'daily') {
          const hour = i.toString().padStart(2, '0');
          formattedDate = `${date} ${hour}:00:00`;
        } else if (type === 'monthly') {
          const day = (i + 1).toString().padStart(2, '0');
          formattedDate = `${date}-${day} 01:00:00`;
        } else if (type === 'yearly') {
          const month = (i + 1).toString().padStart(2, '0');
          formattedDate = `${date}-${month}-01 01:00:00`;
        }

        const newDate = moment.utc(formattedDate).toDate();

        const sameDate = data.find((item: any) => {
          if (type === 'daily') {
            return moment(item.info_dt).isSame(newDate, 'hour');
          }
          if (type === 'monthly') {
            return moment(item.info_dt).isSame(newDate, 'day');
          }
          if (type === 'yearly') {
            return moment(item.info_dt).isSame(newDate, 'month');
          }
          return false;
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
            "communitiesCups": [],
            "created_at": newDate,
            "updated_at": newDate,
          }

          data.splice(i, 0, cupEmptyObject)
        }
      }
    }
    return data
  }

  setProduction(cupsData: any, communityData: any, type: 'yearly' | 'monthly' | 'daily') {
    let dateFormat = 'YYYY-MM-DD HH:mm:ss'
    if (type == "monthly") dateFormat = 'YYYY-MM-DD'
    if (type == "yearly") dateFormat = 'YYYY-MM'

    for (const cups of cupsData) {
      let production = communityData.find((community: { production: number, info_dt: Date }) => {
        if (moment(community.info_dt).format(dateFormat) == moment(cups.info_dt).format(dateFormat)) return community
      })


      if (!production) production = 0
      else production = production.production
      console.log(cups.surplus_distribution, 'cups.surplus_distribution')

      cups.production = production
      cups.production_active = production * parseFloat(cups.surplus_distribution)

    }

    return cupsData
  }

  addCommunityCups(cupsData: CommunityCupsStats[], communityStats: CommunityCups[]) {

    for (const cups of cupsData) {
      const communities: CommunityCups[] | [] = communityStats.filter(communityCups => communityCups.filter_dt == cups.filter_dt) || []
      cups.communitiesCups = communities.map(this.mapCommunityData)
    }

    return cupsData;
  }

  @Put("/balance/deposit")
  @Auth(RESOURCE_NAME)
  async depositBalance(@Body() body: any, @Request() req: any) {
    try {
      const { balance, pk } = body;

      const payload = req.decodedToken;
      const _user = payload.user;

      const user: any = await this.usersDbRequestService.getUserById(_user._id)
      const customer: any = await this.customersDbRequestService.getCustomerById(user.customer_id);
      const cups: any = await this.cupsDbRequestsService.getCupsByCustomerId(user.customer_id);
      const community: any = await this.communityDbRequestService.getCommunityById(cups.communityId)

      //transfer EKW balance from user social wallet to community wallet
      await this.blockchainService.transferERC20(pk, community.walletAddress, balance, "EKW");

      //update customer balance
      const newBalance = customer?.balance + balance;

      const customerUpdate: SaveCustomersDTO = {
        balance: newBalance
      }

      await this.customersDbRequestService.updateCustomerParams(customer.id, customerUpdate)

      //NOTIFICATION: transfer balance. 

      return HttpResponse.success("deposit balance success")

    } catch (error) {
      console.log(error)
      throw new UnexpectedError('deposit error');
    }

  }

  @Put("/balance/witdraw")
  @Auth(RESOURCE_NAME)
  async witdrawBalance(@Body() body: any, @Request() req: any) {
    try {
      const { balance } = body;

      const payload = req.decodedToken;
      const _user = payload.user;

      const user: any = await this.usersDbRequestService.getUserById(_user._id)
      const customer: any = await this.customersDbRequestService.getCustomerById(user.customer_id);
      const cups: any = await this.cupsDbRequestsService.getCupsByCustomerId(user.customer_id);
      const community: any = await this.communityDbRequestService.getCommunityById(cups.communityId)

      //decoded community wallet address PK
      const decodedPK = await PasswordUtils.decryptData(community.walletPwd, process.env.JWT_SECRET!);

      //send from community wallet to customer social wallet
      await this.blockchainService.transferERC20(decodedPK, user.wallet_address, balance, "EKW");

      //update customer balance
      const newBalance = customer?.balance - balance;

      const customerUpdate: SaveCustomersDTO = {
        balance: newBalance
      }

      await this.customersDbRequestService.updateCustomerParams(customer.id, customerUpdate)

      //NOTIFICATION: transfer balance. 

      return HttpResponse.success("witdraw balance success")

    } catch (error) {
      console.log(error)
      throw new UnexpectedError('witdraw error');
    }
  }

  @Get(":id/producers")
  @Auth(RESOURCE_NAME)
  async getProducersById(@Param("id") id: number) {
    if (!id) {
      return HttpResponse.failure("Missing parameter Id.", ErrorCode.MISSING_PARAMETERS)
    }
    const data = await this.prisma.cups.findMany({
      where: {
        communityId: id,
        type: {in:['producer','prosumer']},
        active: true
      },
    });
    //let response = await this.prisma.$queryRaw`SELECT * FROM cups WHERE community_id = ${id} AND (type = 'producer' OR type='prosumer') AND active=1;`;
    return HttpResponse.success("communities producers and prosumers fetched successfully").withData(
      data
    );
  }

}
