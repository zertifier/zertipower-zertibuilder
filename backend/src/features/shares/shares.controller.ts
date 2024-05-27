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
import { SaveSharesDto } from "./save-shares-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import {BadRequestError} from "../../shared/domain/error/common";

export const RESOURCE_NAME = "shares";

@ApiTags(RESOURCE_NAME)
@Controller("shares")
export class SharesController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.shares.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("providers fetched successfully").withData(
      data
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.shares.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("providers fetched successfully").withData(
      this.mapData(data)
    );
  }
  @Get("/community/:communityId/customer/:customerId")
  @Auth(RESOURCE_NAME)
  async getByCommunityAndCustomer(@Param("communityId") communityId: string, @Param("customerId") customerId: string) {
    /*const data = await this.prisma.shares.findUnique({
      where: {
        customerId: parseInt(customerId) || null,
        communityId: parseInt(communityId) || null
      },
    });*/

    const data: any = await this.prisma.$queryRaw`
      SELECT shares from shares WHERE customer_id = ${customerId} AND community_id = ${communityId}
    `

    if (!data.length)
      throw new BadRequestError("User does not have shares");

    return HttpResponse.success("providers fetched successfully").withData(
      {shares: data[0].shares}
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveSharesDto) {
    const data = await this.prisma.shares.create({ data: body });
    return HttpResponse.success("providers saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveSharesDto) {
    const data = await this.prisma.shares.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("providers updated successfully").withData(
      data
    );
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.shares.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("providers removed successfully").withData(
      data
    );
  }

  /*@Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT id,provider
                  FROM providers`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }*/

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.communityId = data.communityId || data.community_id;
    mappedData.customerId = data.customerId || data.customer_id;
    mappedData.shares = data.shares;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }
}
