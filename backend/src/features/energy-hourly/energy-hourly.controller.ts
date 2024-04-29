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

}
