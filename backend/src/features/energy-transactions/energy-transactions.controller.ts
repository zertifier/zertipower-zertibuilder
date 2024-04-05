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
import { CSVNonWorkingConverter } from "src/shared/domain/utils/CSVNonWorkingConverter"

export const RESOURCE_NAME = "energyTransactions";

@ApiTags(RESOURCE_NAME)
@Controller("energy-transactions")
export class EnergyTransactionsController {
  constructor(private prisma: PrismaService, private datatable: Datatable) {
    CSVNonWorkingConverter.convertCsvNonWorking()
    // this.getEnergyPrice(new Date('2024-04-05'), 20, 1)
    // this.getEnergyPrice(new Date('2024-11-07 17:00:00'), 20, 9)
  }

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.energyTransaction.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success(
      "energy_transactions fetched successfully"
    ).withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
   /* const data = await this.prisma.energyTransaction.findUnique({
      where: {
        id: parseInt(id),
      },
    });*/
    const data: any[] = await this.prisma.$queryRaw`
      SELECT et.*, cups
      FROM
        energy_transactions et
        LEFT JOIN cups ON cups_id = cups.id
      WHERE et.id = ${id}
    `;

    return HttpResponse.success(
      "energy_transactions fetched successfully"
    ).withData(this.mapData(data[0]));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveEnergyTransactionsDTO) {
    const data = await this.prisma.energyTransaction.create({ data: body });
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
    const data = await this.prisma.energyTransaction.updateMany({
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
    const data = await this.prisma.energyTransaction.delete({
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
      `SELECT et.id,cups_id,info_dt,kwh_in,kwh_out,kwh_surplus,block_id,tx_kwh_in,tx_kwh_out,et.created_at,et.updated_at, cups, reference
                  FROM energy_transactions et
                  LEFT JOIN cups ON cups.id = cups_id
                  LEFT JOIN energy_blocks eb ON eb.id = et.block_id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.infoDt = data.infoDt || data.info_dt;
    mappedData.kwhIn = data.kwhIn || data.kwh_in;
    mappedData.kwhOut = data.kwhOut || data.kwh_out;
    mappedData.kwhSurplus = data.kwhSurplus || data.kwh_surplus;
    mappedData.blockId = data.blockId || data.block_id;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }

  async getEnergyPrice(date: Date, kw: number, providerId: number){
    let formattedDate = moment(date).format('YYYY-MM-DD')
    let price;

    const nonWorkingDayData = await this.prisma.nonWorkingDays.findFirst({
      where: {
        date: new Date(formattedDate),
        providerId
      }
    })

    if (!nonWorkingDayData){
      formattedDate = moment(date).format('HH:DD:ss')

      const energyBlockData: any = await this.prisma.$queryRaw`
        SELECT *
        FROM energy_blocks
        WHERE active_init >= ${formattedDate}
          AND active_end <= ${formattedDate}
          AND provider_id = ${providerId};
      `

      const consumptionPrice = energyBlockData[0] ? energyBlockData[0].consumption_price : 0
        price = consumptionPrice * kw
    }else{
      price = nonWorkingDayData.price || 0 * kw
    }

    console.log(price, "PRICE")
    return price
  }
}
