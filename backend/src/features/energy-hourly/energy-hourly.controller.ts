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
  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
  import mysql from "mysql2/promise";
  
  export const RESOURCE_NAME = "energyHourly";
  
  @ApiTags(RESOURCE_NAME)
  @Controller("energy-hourly")
  export class EnergyHourlyController {
  
    private conn: mysql.Pool;
  
    constructor(private prisma: PrismaService, private datatable: Datatable,private mysql: MysqlService) {}
  
    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
      const data = await this.prisma.energyHourly.findMany();
      const mappedData = data.map(this.mapData);
      return HttpResponse.success(
        "energy hourly fetched successfully"
      ).withData(data);
    }
  
    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
      const data = await this.prisma.energyHourly.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success(
        "energy hourly fetched successfully"
      ).withData(this.mapData(data));
    }

    @Get("/ranking/consumption/:communityId/:date")
    // @Auth(RESOURCE_NAME)
    async getRankingConsumption(@Param("communityId") communityId: string, @Param("date") date: string) {
      date = `${date}%`

      const data: any = await this.prisma.$queryRaw`
        SELECT c.customer_id, users.wallet_address, SUM(kwh_in) consumption FROM energy_hourly eh
          LEFT JOIN cups c ON eh.cups_id = c.id
          LEFT JOIN users ON c.customer_id = users.customer_id
        WHERE c.type != 'community' AND info_dt LIKE ${date} AND c.community_id = ${communityId} AND kwh_in IS NOT NULL
        GROUP BY c.customer_id
        ORDER BY consumption ASC
      `

      return HttpResponse.success(
        "energy hourly fetched successfully"
      ).withData(data.map(this.mapRanking));
    }

    @Get("/ranking/surplus/:communityId/:date")
    // @Auth(RESOURCE_NAME)
    async getRankingSurplus(@Param("communityId") communityId: string, @Param("date") date: string) {
      date = `${date}%`

      const data: any = await this.prisma.$queryRaw`
        SELECT c.customer_id, users.wallet_address, SUM(kwh_out) surplus FROM energy_hourly eh
          LEFT JOIN cups c ON eh.cups_id = c.id
          LEFT JOIN users ON c.customer_id = users.customer_id
        WHERE c.type != 'community' AND info_dt LIKE ${date} AND c.community_id = ${communityId} AND kwh_out IS NOT NULL
        GROUP BY c.customer_id
        ORDER BY surplus DESC
      `

      return HttpResponse.success(
        "energy hourly fetched successfully"
      ).withData(data.map(this.mapRanking));
    }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT energy_hourly.id,
              cups.cups,
              origin,
              info_dt,
              kwh_in,
              kwh_out,
              kwh_out_virtual,
              kwh_in_price,
              kwh_out_price,
              kwh_in_price_community,
              kwh_out_price_community,
              shares,
              energy_hourly.type,
              cups.reference as cups_name
       FROM energy_hourly
              LEFT JOIN cups ON cups.id = cups_id
              `
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }
  
    mapData(data: any) {
      const mappedData: any = {};

      mappedData.id = data.id
      mappedData.cupsId=data.cupsId
      mappedData.origin=data.origin
      mappedData.infoDt=data.infoDt
      mappedData.kwhIn=data.kwhIn
      mappedData.kwhOut=data.kwhOut
      mappedData.kwhOutVirtual=data.kwhOutVirtual
      mappedData.kwhInPrice=data.kwhInPrice
      mappedData.kwhOutPrice=data.kwhOutPrice
      mappedData.kwhInPriceCommunity=data.kwhInPriceCommunity
      mappedData.kwhOutPriceCommunity=data.kwhOutPriceCommunity
      mappedData.production=data.production
      mappedData.battery=data.battery
      mappedData.shares=data.shares
      mappedData.type=data.type

      return mappedData;
    }

    mapRanking(data: any){
      const mappedData: any = {};

      mappedData.customerId = data.customer_id
      mappedData.walletAddress = data.wallet_address
      mappedData.consumption = data.consumption
      mappedData.surplus = data.surplus

      return mappedData;

    }

}
