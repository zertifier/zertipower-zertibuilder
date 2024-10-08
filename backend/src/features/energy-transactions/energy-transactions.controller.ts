import {Body, Controller, Delete, Get, Param, Post, Put,} from "@nestjs/common";
import {HttpResponse} from "src/shared/infrastructure/http/HttpResponse";
import {PrismaService} from "src/shared/infrastructure/services/prisma-service/prisma-service";
import {Datatable} from "src/shared/infrastructure/services/datatable/Datatable";
import {SaveEnergyTransactionsDTO} from "./save-energy-transactions-dto";
import * as moment from "moment";
import {ApiTags} from "@nestjs/swagger";
import {Auth} from "src/features/auth/infrastructure/decorators";
import {CSVNonWorkingConverter} from "src/shared/domain/utils/CSVNonWorkingConverter"
import {ErrorCode} from "../../shared/domain/error";
import {ShareService} from "../../shared/infrastructure/services/share/share.service";

export const RESOURCE_NAME = "energyTransactions";

@ApiTags(RESOURCE_NAME)
@Controller("energy-transactions")
export class EnergyTransactionsController {
  constructor(private prisma: PrismaService, private datatable: Datatable, private shareService: ShareService) {
    CSVNonWorkingConverter.convertCsvNonWorking()
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
      FROM energy_transactions et
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
    const cupsData = await this.prisma.cups.findFirst({
      where: {
        id: body.cupsId
      }
    })
    if (!cupsData)
      return HttpResponse.failure("Cup not found", ErrorCode.BAD_REQUEST);

    const energyData = await this.getEnergyPrice(new Date(body.infoDt!), cupsData!.providerId)
  /*  body.kwhInPrice = energyData.price * body.kwhIn
    body.kwhOutPrice = energyData.price * body.kwhOut
    body.type = energyData.rate*/
    body.kwhInPrice = energyData.price
    body.kwhOutPrice = 0.06
    body.kwhInPriceCommunity = 0.12
    body.kwhOutPriceCommunity = 0.12
    body.type = energyData.rate

    const data = await this.prisma.energyTransaction.create({data: body});

    await this.prisma.$queryRaw`
      INSERT INTO energy_hourly
      (cups_id,
       origin,
       info_dt,
       type,
       kwh_in,
       kwh_out,
       kwh_out_virtual,
       kwh_in_price,
       kwh_out_price,
       kwh_in_price_community,
       kwh_out_price_community)
      VALUES (${body.cupsId},
              'datadis',
              ${body.infoDt},
              ${body.type},
              ${body.kwhIn},
              ${body.kwhOut},
              ${body.kwhOutVirtual},
              ${body.kwhInPrice},
              ${body.kwhOutPrice},
              ${body.kwhInPriceCommunity},
              ${body.kwhOutPriceCommunity})
    `
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
      `SELECT et.id,
              cups_id,
              info_dt,
              kwh_in,
              kwh_out,
              kwh_surplus,
              block_id,
              tx_kwh_in,
              tx_kwh_out,
              et.created_at,
              et.updated_at,
              cups,
              eb.reference,
              cups.reference as cups_name
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
    mappedData.kwhIn = data.txKwhIn || data.tx_kwh_in;
    mappedData.kwhOut = data.txKwhOut || data.tx_kwh_out;
    mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
    mappedData.kwhSurplus = data.kwhSurplus || data.kwh_surplus;
    mappedData.kwhInPrice = data.kwhInPrice || data.kwh_in_price;
    mappedData.kwhOutPrice = data.kwhOutPrice || data.kwh_out_price;
    mappedData.kwhInPriceCommunity = data.kwhInPriceCommunity || data.kwh_in_price_community;
    mappedData.kwhOutPriceCommunity = data.kwhOutPriceCommunity || data.kwh_out_price_community;
    mappedData.communityId = data.communityId || data.community_id;
    mappedData.providerId = data.providerId || data.provider_id;
    mappedData.blockId = data.blockId || data.block_id;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }

  async getTransactionsWithNullPrice() {
    const transactionsWithNullPrice: any = await this.prisma.$queryRaw`
      SELECT eh.*, cups.community_id, cups.provider_id
      FROM energy_hourly eh
      LEFT JOIN cups ON eh.cups_id = cups.id
      WHERE eh.kwh_in_price IS NULL 
         OR eh.kwh_out_price IS NULL;
    `


    return transactionsWithNullPrice.map(this.mapData);
  }


  async getEnergyPrice(date: Date, providerId: number) {
    let formattedDate = moment(date).format('YYYY-MM-DD')
    let price;

    const nonWorkingDayData = await this.prisma.nonWorkingDays.findFirst({
      where: {
        date: new Date(formattedDate),
        providerId
      }
    })

    let data: { rate: string, price: number } = {
      rate: '',
      price: 0
    }

    if (!nonWorkingDayData) {
      formattedDate = moment(date).format('HH:DD:ss')

      const energyBlockData: any = await this.prisma.$queryRaw`
        SELECT *
        FROM energy_blocks
        WHERE active_init <= ${formattedDate}
          AND active_end >= ${formattedDate}
          AND provider_id = ${providerId};
      `

      const consumptionPrice = energyBlockData[0] ? energyBlockData[0].consumption_price : 0
      price = consumptionPrice
      data.rate = energyBlockData.reference || ''
    } else {
      price = nonWorkingDayData.price || 0
      data.rate = nonWorkingDayData.rate || ''
    }

    data.price = price

    return data
  }


  async updatePrices(data: any){
    await this.prisma.energyHourly.update({
      where: {
        id: parseInt(data.id),
      },
      data: {
        kwhInPrice: data.kwhInPrice,
        kwhOutPrice: data.kwhOutPrice,
        kwhOutVirtual: data.kwhOut,
        type: data.type,
      },
    })
  }

}
