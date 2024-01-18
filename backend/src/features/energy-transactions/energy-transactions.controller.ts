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
import { SaveEnergyTransactionsDTO } from "./save-energy-transactions-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";

export const RESOURCE_NAME = "energyTransactions";

@ApiTags(RESOURCE_NAME)
@Controller("energy-transactions")
export class EnergyTransactionsController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.energyTransactions.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success(
      "energy_transactions fetched successfully"
    ).withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.energyTransactions.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "energy_transactions fetched successfully"
    ).withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveEnergyTransactionsDTO) {
    const data = await this.prisma.energyTransactions.create({ data: body });
    return HttpResponse.success(
      "energy_transactions saved successfully"
    ).withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(
    @Param("id") id: string,
    @Body() body: SaveEnergyTransactionsDTO
  ) {
    const data = await this.prisma.energyTransactions.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success(
      "energy_transactions updated successfully"
    ).withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.energyTransactions.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "energy_transactions removed successfully"
    ).withData(data);
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT id,cups_id,info_dt,kwh_in,kwh_out,kwh_surplus,block_id,created_at,updated_at
                  FROM energy_transactions`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.cupsId = data.cupsId;
    mappedData.infoDt = data.infoDt;
    mappedData.kwhIn = data.kwhIn;
    mappedData.kwhOut = data.kwhOut;
    mappedData.kwhSurplus = data.kwhSurplus;
    mappedData.blockId = data.blockId;
    mappedData.createdAt = data.createdAt;
    mappedData.updatedAt = data.updatedAt;
    return mappedData;
  }
}
