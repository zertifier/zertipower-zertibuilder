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
import { SaveCupsDTO } from "./save-cups-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";

export const RESOURCE_NAME = "cups";

@ApiTags(RESOURCE_NAME)
@Controller("cups")
export class CupsController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

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
    return HttpResponse.success("cups fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCupsDTO) {
    const data = await this.prisma.cups.create({ data: body });
    return HttpResponse.success("cups saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveCupsDTO) {
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
      `SELECT id,cups,provider_id,community_id,location_id,customer_id,created_at,updated_at
                  FROM cups`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.cups = data.cups;
    mappedData.providerId = data.providerId;
    mappedData.communityId = data.communityId;
    mappedData.ubication = data.ubication;
    mappedData.geolocalization = data.geolocalization;
    mappedData.customerId = data.customerId;
    mappedData.createdAt = data.createdAt;
    mappedData.updatedAt = data.updatedAt;
    return mappedData;
  }
}
