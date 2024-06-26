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
import { SaveEnergyRegistersDTO } from "./save-energy-registers-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import {ErrorCode} from "../../shared/domain/error";
import { BlockchainService } from "src/shared/infrastructure/services/blockchain-service";

export const RESOURCE_NAME = "energyRegisters";

@ApiTags(RESOURCE_NAME)
@Controller("energy-registers")
export class EnergyRegistersController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {}

  @Get()
  // @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.energyRegister.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success(
      "energy_registers fetched successfully"
    ).withData(data);
  }

  @Get(":id")
  // @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.energyRegister.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "energy_registers fetched successfully"
    ).withData(data);
  }



  @Post()
  // @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveEnergyRegistersDTO) {
    if (body.type && body.type == 'community'){
      const cupsData = await this.prisma.cups.findFirst({
        where: {
          id: body.cupsId
        }
      })

      if (!cupsData)  return HttpResponse.failure("inexistent cups", ErrorCode.INTERNAL_ERROR)

      const communityId = cupsData.communityId

      const communityCups = await this.prisma.cups.findMany({
        where: {
          communityId: communityId
        }
      })

      let data = []

      for (const cup of communityCups) {
        let registerToAdd = body
        registerToAdd.communityGeneration = (cup.surplusDistribution || 0 ) * registerToAdd.generation
        registerToAdd.cupsId = cup.id
        data.push(await this.prisma.energyRegister.create({ data: body }));
      }

      return HttpResponse.success("energy_registers saved successfully").withData(
        data
      );
    }else{
      const data = await this.prisma.energyRegister.create({ data: body });
      return HttpResponse.success("energy_registers saved successfully").withData(
        data
      );
    }
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveEnergyRegistersDTO) {
    const data = await this.prisma.energyRegister.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success(
      "energy_registers updated successfully"
    ).withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.energyRegister.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success(
      "energy_registers removed successfully"
    ).withData(data);
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT er.id,info_dt,cups_id,import,consumption,export,generation,er.created_at,er.updated_at, cups
                  FROM energy_registers er
                  LEFT JOIN cups ON cups.id = cups_id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.infoDt = data.infoDt | data.info_dt;
    mappedData.cupsId = data.cupsId | data.cups_id;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.generation = data.generation;
    mappedData.createdAt = data.createdAt | data.created_at;
    mappedData.updatedAt = data.updatedAt | data.updated_at;
    return mappedData;
  }
}
