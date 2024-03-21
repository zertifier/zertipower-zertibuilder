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
import { SaveSmartContractsDTO } from "./save-smart-contracts-dto";
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
    const data = await this.prisma.smartContract.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success(
      "smart_contracts fetched successfully"
    ).withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.smartContract.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "smart_contracts fetched successfully"
    ).withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveSmartContractsDTO) {
    const data = await this.prisma.smartContract.create({ data: body });
    return HttpResponse.success("smart_contracts saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveSmartContractsDTO) {
    const data = await this.prisma.smartContract.updateMany({
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
    const data = await this.prisma.smartContract.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "smart_contracts removed successfully"
    ).withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.contractAddress = data.contractAddress;
    mappedData.blockchainId = data.blockchainId;
    return mappedData;
  }
}
