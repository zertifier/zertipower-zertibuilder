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

export const RESOURCE_NAME = "smartContracts";

@ApiTags(RESOURCE_NAME)
@Controller("smart-contracts")
export class SmartContractsController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.smartContracts.findMany();
    const mappedData = data;
    return HttpResponse.success(
      "smart_contracts fetched successfully"
    ).withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.smartContracts.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "smart_contracts fetched successfully"
    ).withData(data);
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: any) {
    const data = await this.prisma.smartContracts.create({ data: body });
    return HttpResponse.success("smart_contracts saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: any) {
    const data = await this.prisma.smartContracts.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success(
      "smart_contracts updated successfully"
    ).withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.smartContracts.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "smart_contracts removed successfully"
    ).withData(data);
  }

}
