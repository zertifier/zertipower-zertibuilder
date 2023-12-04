import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveEnergyRegistersHourlyDto } from "./save-energy-registers-hourly-dto";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import { ErrorCode } from "../../shared/domain/error";

export const RESOURCE_NAME = "energyRegistersHourly";

@ApiTags(RESOURCE_NAME)
@Controller("energy-registers-hourly")
export class EnergyRegistersHourlyController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {
  }

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.energyRegistersHourly.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("energy_registers_hourly fetched successfully").withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.energyRegistersHourly.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success("energy_registers fetched successfully").withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveEnergyRegistersHourlyDto) {
    const data = await this.prisma.energyRegistersHourly.create({ data: body });
    return HttpResponse.success("energy_registers_hourly saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveEnergyRegistersHourlyDto) {
    const data = await this.prisma.energyRegistersHourly.updateMany({
      where: {
        id: parseInt(id)
      },
      data: body
    });
    return HttpResponse.success("energy_registers_hourly updated successfully").withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.energyRegistersHourly.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success("energy_registers_hourly removed successfully").withData(data);
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    try{
      const data = await this.datatable.getData(body, `SELECT
                                                            info_datetime,
                                                            cups_id,
                                                            import,
                                                            consumption,
                                                            export,
                                                            generation
                                                     FROM energy_registers_hourly`);
      return HttpResponse.success("Datatables fetched successfully").withData(data);
    }catch(e){
      console.log(e);
      return HttpResponse.failure(
        'error getting datatables data',
        ErrorCode.UNEXPECTED
      );
    }

  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.cupsId = data.cupsId;
    mappedData.infoDatetime = data.infoDatetime;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.generation = data.generation;
    return mappedData;
  }
}
