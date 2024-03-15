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

    console.log(data,this.mapData(data))

    return HttpResponse.success("cups fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: any) {
    const data = await this.prisma.cups.create({ data: body });
    return HttpResponse.success("cups saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: any) {
    console.log("bodycups : ", body);
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
      `SELECT cups.id as id,cups,providers.provider as provider,communities.name as community,locations.municipality as municipality,customers.name as customer,cups.created_at as created_at,cups.updated_at as updated_at
                  FROM cups 
                  LEFT JOIN customers ON customer_id=customers.id 
                  LEFT JOIN locations on location_id=locations.id
                  LEFT JOIN providers on provider_id=providers.id
                  LEFT JOIN communities on community_id=communities.id`
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
}
