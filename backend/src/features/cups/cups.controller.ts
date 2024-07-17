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
import { DatadisService } from "src/shared/infrastructure/services";
import { SaveCupsDto } from "./save-cups-dto";
import { PasswordUtils } from "../users/domain/Password/PasswordUtils";
import { CupsType } from "@prisma/client";
import { ErrorCode } from "src/shared/domain/error";

export const RESOURCE_NAME = "cups";

@ApiTags(RESOURCE_NAME)
@Controller("cups")
export class CupsController {
  constructor(private prisma: PrismaService, private datatable: Datatable, private datadisService: DatadisService) { }

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.cups.findMany();
    const mappedData = data.map(this.mapData);
    return HttpResponse.success("cups fetched successfully").withData(data);
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.cups.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (data && data.datadisPassword) data.datadisPassword = PasswordUtils.decryptData(data.datadisPassword, process.env.JWT_SECRET!)
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      data
    );
  }

  @Get(":id/stats/:origin/daily/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    let data: any = await this.prisma.$queryRaw`
      SELECT * 
      FROM energy_hourly
      WHERE DATE(info_dt) = ${date}
        AND cups_id = ${id}
        AND origin = ${origin}
      GROUP BY HOUR(info_dt)
      ORDER BY info_dt;
    `;

    let communityTotalSurplus: any = await this.prisma.$queryRaw`
      SELECT sum(kwh_out) as total_surplus, info_dt
      FROM energy_hourly eh
             LEFT JOIN cups cu
                       ON eh.cups_id = cu.id
      where cu.type = 'community'
      AND DATE(info_dt) = ${date}
      GROUP BY HOUR(info_dt)
    `

    let test: any = await this.prisma.$queryRaw`
      SELECT a.*,
             total_surplus * cp.surplus_distribution production
      FROM energy_hourly a
             LEFT JOIN
           (SELECT sum(kwh_out) as total_surplus,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups cu
                 ON eh.cups_id = cu.id
            WHERE cu.type = 'community'
              AND DATE(info_dt) = ${date}
            GROUP BY HOUR(info_dt)
            ORDER BY info_dt) b
           ON a.info_dt = b.info_dt
             LEFT JOIN cups cp ON cp.id = a.cups_id
      WHERE DATE(a.info_dt) = ${date}
        AND cups_id = ${id}
        AND origin = ${origin}
      GROUP BY HOUR(a.info_dt)
      ORDER BY a.info_dt;
    `

    data = this.dataWithEmpty(data, date, 24, 'daily')
    const mappedData = data.map(this.energyRegistersMapData);

    let dataToSend = { stats: [] }
    dataToSend.stats = mappedData
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      dataToSend
    );
  }

  @Get(":id/stats/:origin/monthly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year, month] = date.split('-');

    let data: any = await this.prisma.$queryRaw`
      SELECT a.*,
             SUM(kwh_in)                  AS kwh_in,
             SUM(kwh_out)                 AS kwh_out,
             SUM(kwh_out_virtual)         AS kwh_out_virtual,
             kwh_in_price            AS kwh_in_price,
             kwh_out_price           AS kwh_out_price,
             kwh_in_price_community  AS kwh_in_price_community,
             kwh_out_price_community AS kwh_out_price_community,
             DATE(a.info_dt)                AS info_dt,
             SUM(production) production
      FROM energy_hourly a
             LEFT JOIN
           (SELECT sum(kwh_out) as total_surplus,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups cu
                 ON eh.cups_id = cu.id
            WHERE cu.type = 'community'
              AND YEAR(info_dt) = ${parseInt(year)}
              AND MONTH(info_dt) = ${parseInt(month)}
            GROUP BY DAY(info_dt)
            ORDER BY info_dt) b
           ON a.info_dt = b.info_dt
             LEFT JOIN cups cp ON cp.id = a.cups_id
      WHERE YEAR(a.info_dt) = ${parseInt(year)}
        AND MONTH(a.info_dt) = ${parseInt(month)}
        AND cups_id = ${id}
        AND origin = ${origin}
      GROUP BY DAY(a.info_dt)
      ORDER BY a.info_dt;
    `;

    const daysOfMonth = moment(date).daysInMonth()
    data = this.dataWithEmpty(data, date, daysOfMonth, 'monthly')

    const mappedData = data.map(this.energyRegistersMapData);
    let dataToSend = { stats: [] }
    dataToSend.stats = mappedData
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      dataToSend
    );
  }
  @Get(":id/stats/:origin/yearly/:date")
  // @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    const [year] = date.split('-');

    let data: any = await this.prisma.$queryRaw`
      SELECT a.*,
             SUM(kwh_in)                  AS         kwh_in,
             SUM(kwh_out)                 AS         kwh_out,
             SUM(kwh_out_virtual)         AS         kwh_out_virtual,
             kwh_in_price          AS         kwh_in_price,
             kwh_out_price           AS         kwh_out_price,
             kwh_in_price_community  AS         kwh_in_price_community,
             kwh_out_price_community AS         kwh_out_price_community,
             DATE(a.info_dt)              AS         info_dt,
             SUM(production) production
      FROM energy_hourly a
             LEFT JOIN
           (SELECT sum(kwh_out) as total_surplus,
                   info_dt
            FROM energy_hourly eh
                   LEFT JOIN
                 cups cu
                 ON eh.cups_id = cu.id
            WHERE cu.type = 'community'
              AND YEAR(info_dt) = ${parseInt(year)}
            GROUP BY MONTH(info_dt)
            ORDER BY info_dt) b
           ON a.info_dt = b.info_dt
             LEFT JOIN cups cp ON cp.id = a.cups_id
      WHERE YEAR(a.info_dt) = ${parseInt(year)}
        AND cups_id = ${id}
        AND origin = ${origin}
      GROUP BY MONTH(a.info_dt)
      ORDER BY a.info_dt;
    `;


    data = this.dataWithEmpty(data, date, 12, 'yearly')

    const mappedData = data.map(this.energyRegistersMapData);
    let dataToSend = { stats: [] }
    dataToSend.stats = mappedData
    return HttpResponse.success("cups fetched successfully").withData(
      // this.mapData(data)
      dataToSend
    );
  }

  @Get("/datadis-active/:id")
  @Auth(RESOURCE_NAME)
  async datadisActive(@Param("id") id: string) {

    let datadisToken: string;
    let loginData: { username: string, password: string } = { username: '', password: '' };
    let supplies: any[] = [];
    let cupsInfo: any;
    let communityInfo: any;

    try {

      cupsInfo = await this.prisma.$queryRaw
        `
      SELECT cups.cups, cups.datadis_user, cups.datadis_password, cups.community_id, cups.datadis_active, customers.dni
        FROM cups LEFT JOIN customers ON customers.id = cups.customer_id
        WHERE cups.id = ${id}
      `;

      if (!cupsInfo[0]) {
        return HttpResponse.failure(`Cups with this id not found`, ErrorCode.BAD_REQUEST)
      }

    } catch (e) {
      return HttpResponse.failure(`${e}`, ErrorCode.INTERNAL_ERROR)
    }

    try {
      communityInfo = await this.prisma.$queryRaw
        `
      SELECT cups.cups, cups.datadis_user, cups.datadis_password, cups.community_id
        FROM cups
        WHERE community_id = ${cupsInfo[0].community_id} and type = 'community'
      `;

    } catch (e) {
      console.log(e)
      return HttpResponse.failure(`${e}`, ErrorCode.INTERNAL_ERROR)
    }

    try {

      if (cupsInfo[0].datadis_active) {
        //user login
        loginData.username = cupsInfo[0].datadis_user;
        loginData.password = PasswordUtils.decryptData(cupsInfo[0].datadis_password, process.env.JWT_SECRET!);
        datadisToken = await this.datadisService.login(loginData.username, loginData.password)
        supplies = await this.datadisService.getSupplies(datadisToken);
      } else if (communityInfo[0]) {
        let dni = cupsInfo[0].dni;
        //community login
        loginData.username = communityInfo[0].datadis_user;
        loginData.password = PasswordUtils.decryptData(communityInfo[0].datadis_password, process.env.JWT_SECRET!);
        datadisToken = await this.datadisService.login(loginData.username, loginData.password)
        supplies = await this.datadisService.getAuthorizedSupplies(datadisToken, dni);
      } else {
        return HttpResponse.failure(`Data not found`, ErrorCode.UNEXPECTED)
      }

      if (supplies[0]) {
        return HttpResponse.success("the cups is active").withData({ active: true })
      } else {
        return HttpResponse.success("the cups is inactive").withData({ active: false })
      }

    } catch (e) {
      console.log(e)
      //return HttpResponse.failure(`${e}`, ErrorCode.INTERNAL_ERROR)
      return HttpResponse.success(e.toString()).withData({ active: false })
    }

    // const datadisRows: any = await this.prisma.$queryRaw
    //   `
    //   SELECT EXISTS (
    //     SELECT 1
    //     FROM datadis_energy_registers
    //     WHERE cups_id = ${id}
    //   ) AS datadis_active;
    //   `;

    // if (datadisRows[0].datadis_active) {

  }

  @Get("/community/:communityId/total")
  async getTotalByCommunity(@Param("communityId") communityId: string) {
    const data: any = await this.prisma.$queryRaw`
        SELECT COUNT(*) total FROM cups WHERE community_id = ${communityId} AND type != 'community'
    `

    return HttpResponse.success("the cups is active").withData({ total: parseInt(data[0].total) || 0 })
  }

  @Post("/datadis")
  //@Auth(RESOURCE_NAME)
  async datadis(@Body() body: any) {

    let data;

    if (!body.cups || !body.customerId || !body.datadisUser || !body.datadisPassword) {
      return HttpResponse.failure("Missing parameters. The request needs cups, customerId, datadisUser, datadisPassword", ErrorCode.MISSING_PARAMETERS)
    }

    const cupsData: any = await this.prisma.$queryRaw
      `SELECT * from cups WHERE cups = ${body.cups}`;

    body.datadisActive = true;

    //let dni = body.dni;
    //delete body.dni;
    //let cupsType:CupsType = 'consumer'
    //body.type  = 'consumer'

    body.datadisPassword = PasswordUtils.encryptData(body.datadisPassword, process.env.JWT_SECRET!)

    const customerData = await this.prisma.customers.findUnique({
      where: {
        id: body.customerId,
      },
    });

    if (!customerData) {
      return HttpResponse.failure("Invalid parameters. Customer not found", ErrorCode.MISSING_PARAMETERS)
    }

    //return HttpResponse.failure("Invalid parameters. Cups not found",ErrorCode.MISSING_PARAMETERS)

    if (body.dni) {
      try {
        const datadisRows: any = await this.prisma.$queryRaw`UPDATE customers SET dni=${body.dni} WHERE id=${body.customerId}`
      } catch (e) {
        return HttpResponse.failure("Error updating customer", ErrorCode.INTERNAL_ERROR).withData(e);
      }
    }

    delete body.dni;

    try {
      if (!cupsData.length) {
        data = await this.prisma.cups.create({
          data: body
        })
      } else {
        data = await this.prisma.cups.update({
          where: {
            id: cupsData[0].id,
          },
          data: body,
        });
      }
    } catch (e) {
      return HttpResponse.failure("Error inserting or updating cups", ErrorCode.INTERNAL_ERROR).withData(e);
    }

    //update datadis
    //let startDate = moment().subtract(1, 'months').format('YYYY/MM'); 
    //let endDate = moment().format('YYYY/MM');
    //this.datadisService.run(startDate, endDate)

    return HttpResponse.success("cups with datadis saved successfully").withData("data");

  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCupsDto) {
    if (body.datadisPassword) body.datadisPassword = PasswordUtils.encryptData(body.datadisPassword, process.env.JWT_SECRET!)
    const data = await this.prisma.cups.create({ data: body });
    if (data.datadisPassword) data.datadisPassword = PasswordUtils.decryptData(data.datadisPassword, process.env.JWT_SECRET!)
    return HttpResponse.success("cups saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: any) {
    if (body.datadisPassword) body.datadisPassword = PasswordUtils.encryptData(body.datadisPassword, process.env.JWT_SECRET!)
    const data = await this.prisma.cups.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });

    return HttpResponse.success("cups updated successfully").withData(data);
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.cups.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("cups removed successfully").withData(data);
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT cups.id as id,
              cups,
              providers.provider as     provider,
              cups.surplus_distribution,
              communities.name as       community,
              locations.municipality as municipality,
              customers.name         as customer,
              cups.created_at        as created_at,
              cups.updated_at        as updated_at
       FROM cups
              LEFT JOIN customers ON customer_id = customers.id
              LEFT JOIN locations on location_id = locations.id
              LEFT JOIN providers on provider_id = providers.id
              LEFT JOIN communities on community_id = communities.id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};

    mappedData.id = data.id
    mappedData.cups = data.cups
    mappedData.providerId = data.provider_id
    mappedData.communityId = data.community_id
    mappedData.surplusDistribution = data.surplus_distribution
    mappedData.locationId = data.location_id
    mappedData.address = data.address
    mappedData.customerId = data.customer_id
    mappedData.lng = data.lng
    mappedData.lat = data.lat
    mappedData.type = data.type
    mappedData.datadisActive = data.datadis_active
    mappedData.datadisUser = data.datadis_user
    mappedData.datadisPassword = data.datadis_password
    mappedData.smartMeterActive = data.smart_meter_active
    mappedData.smartMeterModel = data.smart_meter_model
    mappedData.smartMeterApiKey = data.smart_meter_api_key
    mappedData.inverterActive = data.inverter_active
    mappedData.inverterModel = data.inverter_model
    mappedData.inverterApiKey = data.inverter_api_key
    mappedData.sensorActive = data.sensor_active
    mappedData.sensorModel = data.sensor_model
    mappedData.sensorApiKey = data.sensor_api_key
    mappedData.createdAt = data.created_at
    mappedData.updatedAt = data.updated_at

    return mappedData;
  }

  energyRegistersMapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.infoDt = data.infoDt || data.info_dt;
    mappedData.cupsId = data.cupsId || data.cups_id;
    mappedData.origin = data.origin;
    mappedData.kwhIn = data.kwhIn || data.kwh_in;
    mappedData.kwhOut = data.kwhOut || data.kwh_out;
    mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
    mappedData.kwhInPrice = data.kwhInPrice || data.kwh_in_price;
    mappedData.kwhOutPrice = data.kwhOutPrice || data.kwh_out_price;
    mappedData.kwhInPriceCommunity = data.kwhInPriceCommunity || data.kwh_in_price_community;
    mappedData.kwhOutPriceCommunity = data.kwhOutPriceCommunity || data.kwh_out_price_community;
    mappedData.type = data.type;
    mappedData.production = data.production ? data.production : 0;
    mappedData.generation = data.generation;
    mappedData.createdAt = data.createdAt || data.created_at;
    mappedData.updatedAt = data.updatedAt || data.updated_at;
    return mappedData;
  }

  dataWithEmpty(data: any, date: string, qty: number, type: 'yearly' | 'monthly' | 'daily') {
    if (data.length < qty) {
      for (let i = 0; i < qty; i++) {
        let formattedDate;
        if (type == 'daily') {
          const hour = i.toString().length > 1 ? i : `0${i}`
          formattedDate = `${date} ${hour}:00:00`
        }

        if (type == 'monthly') {
          const day = (i + 1).toString().length > 1 ? i + 1 : `0${i + 1}`
          formattedDate = `${date}-${day} 01:00:00`
        }

        if (type == 'yearly') {
          const month = (i + 1).toString().length > 1 ? i + 1 : `0${i + 1}`
          formattedDate = `${date}-${month}-01 01:00:00`
        }


        const newDate = moment.utc(formattedDate).toDate()

        const sameDate = data.find((item: any) => {
          if (type == 'daily' && item.info_dt)
            return item.info_dt.toString() == newDate.toString()

          if (type == 'monthly' && item.info_dt) {
            const dayOfItem = moment(item.info_dt).format('YYYY-MM-DD')
            const dayOfNewDate = moment(newDate).format('YYYY-MM-DD')
            return dayOfItem == dayOfNewDate
          }

          if (type == 'yearly' && item.info_dt) {
            const monthOfItem = moment(item.info_dt).format('YYYY-MM')
            const monthOfNewDate = moment(newDate).format('YYYY-MM')
            return monthOfItem == monthOfNewDate
          }

          return

        });
        if (!sameDate) {
          const cupEmptyObject = {
            "id": 0,
            "cups_id": 0,
            "info_dt": newDate,
            "type": "",
            "origin": "datadis",
            "kwh_in": 0,
            "kwh_out": 0,
            "kwh_out_virtual": 0,
            "kwh_in_price": 0,
            "kwh_out_price": 0,
            "kwh_in_price_community": 0,
            "kwh_out_price_community": 0,
            "production": 0,
            "created_at": newDate,
            "updated_at": newDate,
            "community_id": 7
          }

          data.splice(i, 0, cupEmptyObject)
        }
      }
    }
    return data
  }
}
