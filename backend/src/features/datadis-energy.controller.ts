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
  import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
  import { DatadisService } from "src/shared/infrastructure/services";
  
  export const RESOURCE_NAME = "datadisEnergy";
  
  @ApiTags(RESOURCE_NAME)
  @Controller("datadisEnergy")
  export class DatadisEnergyController {
    constructor(private prisma: PrismaService, private datatable: Datatable, private datadisService:DatadisService) {}
  
    @Get()
    @Auth(RESOURCE_NAME)
    async get() {
      const data = await this.prisma.datadis_energy_registers.findMany();
      return HttpResponse.success("cups fetched successfully").withData(data);
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
      const data = await this.prisma.datadis_energy_registers.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success("datadis energy register fetched successfully").withData(data);
    }

    @Post()
    @Auth(RESOURCE_NAME)
    async create(@Body() body: any) {
      const data = await this.prisma.datadis_energy_registers.create({ data: body });
      return HttpResponse.success("datadis energy register saved successfully").withData(data);
    }
  
    @Put(":id")
    @Auth(RESOURCE_NAME)
    async update(@Param("id") id: string, @Body() body: any) {
      const data = await this.prisma.datadis_energy_registers.updateMany({
        where: {
          id: parseInt(id),
        },
        data: body,
      });
      return HttpResponse.success("datadis energy register updated successfully").withData(data);
    }
  
    @Delete(":id")
    @Auth(RESOURCE_NAME)
    async remove(@Param("id") id: string) {
      const data = await this.prisma.datadis_energy_registers.delete({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success("datadis energy register removed successfully").withData(data);
    }
  
    @Post("datatable")
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
      const data = await this.datatable.getData(body,`SELECT * FROM datadis_energy_registers`);
      return HttpResponse.success("Datatables fetched successfully").withData(data);
    }

}