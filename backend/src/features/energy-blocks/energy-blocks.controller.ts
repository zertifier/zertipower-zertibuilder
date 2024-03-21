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
import { SaveEnergyBlocksDTO } from "./save-energy-blocks-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";

export const RESOURCE_NAME = "energyBlocks";

@ApiTags(RESOURCE_NAME)
@Controller("energy-blocks")
export class EnergyBlocksController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.energyBlock.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("energy_blocks fetched successfully").withData(
      data
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.energyBlock.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("energy_blocks fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveEnergyBlocksDTO) {
    console.log(body, "BODY")
    const data = await this.prisma.energyBlock.create({ data: body });
    return HttpResponse.success("energy_blocks saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveEnergyBlocksDTO) {
    const data = await this.prisma.energyBlock.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("energy_blocks updated successfully").withData(
      data
    );
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.energyBlock.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("energy_blocks removed successfully").withData(
      data
    );
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT id,reference,expiration_dt,active_init,active_end,consumption_price,generation_price
                  FROM energy_blocks`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.reference = data.reference;
    mappedData.expirationDt = data.expirationDt ||data.expiration_dt;
    mappedData.activeInit = data.activeInit || data.active_init;
    mappedData.activeEnd = data.activeEnd  || data.active_end;
    mappedData.consumptionPrice = data.consumptionPrice || data.consumption_price ;
    mappedData.generationPrice = data.generationPrice || data.generation_price;
    return mappedData;
  }
}
