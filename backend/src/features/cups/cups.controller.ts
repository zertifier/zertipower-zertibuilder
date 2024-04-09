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
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import { DatadisService } from "src/shared/infrastructure/services";
import {SaveCupsDto} from "./save-cups-dto";
import {PasswordUtils} from "../users/domain/Password/PasswordUtils";

export const RESOURCE_NAME = "cups";

@ApiTags(RESOURCE_NAME)
@Controller("cups")
export class CupsController {
  constructor(private prisma: PrismaService, private datatable: Datatable, private datadisService:DatadisService) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.cups.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("cups fetched successfully").withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.cups.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (data && data.datadisPassword) data.datadisPassword = PasswordUtils.decryptData(data.datadisPassword, process.env.JWT_SECRET!)
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      data
    );
  }

  @Get(":id/stats/:origin/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const data: any = await this.prisma.$queryRaw`
      SELECT * 
      FROM energy_hourly
      WHERE DATE(info_dt) = ${date}
        AND cups_id = ${id}
        AND origin = ${origin}
      ORDER BY info_dt;
    `;

    const mappedData = data.map(this.energyRegistersMapData);
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      mappedData
    );
  }

  @Get(":id/stats/:origin/monthly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year, month] = date.split('-');

    const data: any = await this.prisma.$queryRaw`
      SELECT *,
             SUM(kwh_in) AS kwh_in,
             SUM(kwh_out) AS kwh_out,
             SUM(kwh_out_virtual) AS kwh_out_virtual,
             SUM(kwh_in_price) AS kwh_in_price,
             SUM(kwh_out_price) AS kwh_out_price,
             SUM(kwh_in_price_community) AS kwh_in_price_community,
             SUM(kwh_out_price_community) AS kwh_out_price_community,
             DATE(info_dt) AS info_dt
      FROM energy_hourly
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND MONTH(info_dt) = ${parseInt(month)}
        AND cups_id = ${id}
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
  @Get(":id/stats/:origin/yearly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year] = date.split('-');

    const data: any = await this.prisma.$queryRaw`
      SELECT *,
             SUM(kwh_in) AS kwh_in,
             SUM(kwh_out) AS kwh_out,
             SUM(kwh_out_virtual) AS kwh_out_virtual,
             SUM(kwh_in_price) AS kwh_in_price,
             SUM(kwh_out_price) AS kwh_out_price,
             SUM(kwh_in_price_community) AS kwh_in_price_community,
             SUM(kwh_out_price_community) AS kwh_out_price_community,
             DATE(info_dt) AS info_dt
      FROM energy_hourly
      WHERE YEAR(info_dt) = ${parseInt(year)}
        AND cups_id = ${id}
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
  async create(@Body() body: SaveCupsDto) {
    if (body.datadisPassword) body.datadisPassword = PasswordUtils.encryptData(body.datadisPassword, process.env.JWT_SECRET!)
    if (body.surplusDistribution) body.surplusDistribution = body.surplusDistribution.toString()
    const data = await this.prisma.cups.create({ data: body });
    if (data.datadisPassword) data.datadisPassword = PasswordUtils.decryptData(data.datadisPassword, process.env.JWT_SECRET!)
    return HttpResponse.success("cups saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: any) {
    console.log("bodycups : ", body);
    if (body.datadisPassword) body.datadisPassword = PasswordUtils.encryptData(body.datadisPassword, process.env.JWT_SECRET!)
    const data = await this.prisma.cups.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });

    return HttpResponse.success("cups updated successfully").withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.cups.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("cups removed successfully").withData(data);
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT cups.id as id,
              cups,
              providers.provider as     provider,
              cups.surplus_distribution,
              communities.name as       community,
              locations.municipality as municipality,
              customers.name         as customer,
              cups.created_at        as created_at,
              cups.updated_at        as updated_at
       FROM cups
              LEFT JOIN customers ON customer_id = customers.id
              LEFT JOIN locations on location_id = locations.id
              LEFT JOIN providers on provider_id = providers.id
              LEFT JOIN communities on community_id = communities.id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    
    mappedData.id=data.id
    mappedData.cups=data.cups
    mappedData.providerId=data.provider_id
    mappedData.communityId=data.community_id
    mappedData.surplusDistribution=data.surplus_distribution
    mappedData.locationId=data.location_id
    mappedData.address=data.address
    mappedData.customerId=data.customer_id
    mappedData.lng=data.lng
    mappedData.lat=data.lat
    mappedData.type=data.type
    mappedData.datadisActive=data.datadis_active
    mappedData.datadisUser=data.datadis_user
    mappedData.datadisPassword=data.datadis_password
    mappedData.smartMeterActive=data.smart_meter_active
    mappedData.smartMeterModel=data.smart_meter_model
    mappedData.smartMeterApiKey=data.smart_meter_api_key
    mappedData.inverterActive=data.inverter_active
    mappedData.inverterModel=data.inverter_model
    mappedData.inverterApiKey=data.inverter_api_key
    mappedData.sensorActive=data.sensor_active
    mappedData.sensorModel=data.sensor_model
    mappedData.sensorApiKey=data.sensor_api_key
    mappedData.createdAt=data.created_at
    mappedData.updatedAt=data.updated_at

    return mappedData;
  }

  energyRegistersMapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.infoDt = data.infoDt || data.info_dt;
    mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.origin = data.origin;
    mappedData.kwhIn = data.kwhIn || data.kwh_in;
    mappedData.kwhOut = data.kwhOut || data.kwh_out;
    mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
    mappedData.kwhInPrice = data.kwhInPrice || data.kwh_in_price;
    mappedData.kwhOutPrice = data.kwhOutPrice || data.kwh_out_price;
    mappedData.kwhInPriceCommunity = data.kwhInPriceCommunity || data.kwh_in_price_community;
    mappedData.kwhOutPriceCommunity = data.kwhOutPriceCommunity || data.kwh_out_price_community;
    mappedData.type = data.type;
    mappedData.generation = data.generation;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }
}
