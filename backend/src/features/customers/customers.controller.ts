import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveCustomersDTO } from "./save-customers-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";
import { CustomersDbRequestsService } from "./customers-db-requests.service";
import { ErrorCode } from "src/shared/domain/error";
import { DatadisService } from "src/shared/infrastructure/services";
import { PasswordUtils } from "../users/domain/Password/PasswordUtils";
export const RESOURCE_NAME = "customers";

@ApiTags(RESOURCE_NAME)
@Controller("customers")
export class CustomersController {
  private conn: mysql.Pool;
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable,
    private mysql: MysqlService,
    private customersDbRequestsService: CustomersDbRequestsService,
    private datadisService: DatadisService
  ) {
    this.conn = this.mysql.pool;
  }

  @Get("/")
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.customers.findMany();
    const mappedData = data.map(this.mapData);

    return HttpResponse.success("customers fetched successfully").withData(
      mappedData
    );
  }

  @Get("/cups/:customerId")
  @Auth(RESOURCE_NAME)
  async getCustomersCups(@Param("customerId") customerId: string) {
    console.log("cups customers")
    try {
      let url = `SELECT cups.* , customers.name, customers.wallet_address FROM cups LEFT JOIN customers on cups.customer_id = customers.id WHERE customers.id = ?`;
      const [ROWS]: any[] = await this.conn.query(url, customerId);

      return HttpResponse.success("customers fetched successfully").withData(
        ROWS
      );
    } catch (e) {
      console.log("error getting customers-cups:", e);
    }
  }

  @Get("/cups")
  @Auth(RESOURCE_NAME)
  async getByCups() {
    try {
      let url = `SELECT cups.* , customers.name, customers.wallet_address FROM cups LEFT JOIN customers on cups.customer_id = customers.id`;
      const [ROWS]: any[] = await this.conn.query(url);

      return HttpResponse.success("customers fetched successfully").withData(
        ROWS
      );
    } catch (e) {
      console.log("error getting customers-cups:", e);
    }
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.customers.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("customers fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCustomersDTO) {
    const data = await this.prisma.customers.create({ data: body });
    return HttpResponse.success("customers saved successfully").withData(data);
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveCustomersDTO) {

    //todo: get customer, to compare balance, cannot upload balance.

    const data = await this.prisma.customers.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("customers updated successfully").withData(
      data
    );
  }

  @Get(":id/stats/:origin/daily/:date")
  @Auth(RESOURCE_NAME)
  async getByIdStatsDaily(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    try {
      const data = await this.customersDbRequestsService.getByIdStatsDaily(id, origin, date)
      return HttpResponse.success("cups fetched successfully").withData(
        data
      );
    } catch (error) {
      console.log(error)
      return HttpResponse.failure('Error obtaining daily data', ErrorCode.INTERNAL_ERROR)
    }
  }

  @Get(":id/stats/:origin/monthly/:date")
  @Auth(RESOURCE_NAME)
  async getByIdStatsMonthly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    try {
      const data = await this.customersDbRequestsService.getByIdStatsMonthly(id, origin, date)
      return HttpResponse.success("cups fetched successfully").withData(
        data
      );
    } catch (error) {
      console.log(error)
      return HttpResponse.failure('Error obtaining monthly data', ErrorCode.INTERNAL_ERROR)
    }
  }

  @Get(":id/stats/:origin/yearly/:date")
  @Auth(RESOURCE_NAME)
  async getByIdStatsYearly(@Param("id") id: string, @Param("origin") origin: string, @Param("date") date: string) {
    try {
      const data = await this.customersDbRequestsService.getByIdStatsYearly(id, origin, date)
      return HttpResponse.success("cups fetched successfully").withData(
        data
      );
    } catch (error) {
      console.log(error)
      return HttpResponse.failure('Error obtaining yearly data', ErrorCode.INTERNAL_ERROR)
    }
  }

  // @Put("/balance/:id")
  // @Auth(RESOURCE_NAME)
  // async updateBalance(@Param("id") id: string, @Body() body: SaveCustomersDTO) {

  //   //todo: get and transfer from customer wallet to central wallet
  //   //todo: update balance

  //   const data = await this.prisma.customers.updateMany({
  //     where: {
  //       id: parseInt(id),
  //     },
  //     data: body,
  //   });
  //   return HttpResponse.success("customers updated successfully").withData(
  //     data
  //   );
  // }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.customers.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("customers removed successfully").withData(
      data
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
      SELECT cups.origin, cups.cups, cups.datadis_user, cups.datadis_password, cups.community_id, cups.datadis_active, customers.dni
        FROM cups LEFT JOIN customers ON customers.id = cups.customer_id
        WHERE cups.customer_id = ${id}
      `;

      if (!cupsInfo.length) {
        return HttpResponse.failure(`Cups with this customer id not found`, ErrorCode.BAD_REQUEST)
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

      const datadisActive = cupsInfo.find((cups: any) => { cups.datadis_active });

      if (datadisActive) {
        //user login
        loginData.username = cupsInfo[0].datadis_user;
        loginData.password = PasswordUtils.decryptData(cupsInfo[0].datadis_password, process.env.JWT_SECRET!);
        datadisToken = await this.datadisService.login(loginData.username, loginData.password)
        supplies = await this.datadisService.getSupplies(datadisToken);

      } else { //can be datadis authorized one:
        //community login
        let dni = cupsInfo[0].dni;
        loginData.username = communityInfo[0].datadis_user;
        loginData.password = PasswordUtils.decryptData(communityInfo[0].datadis_password, process.env.JWT_SECRET!);
        datadisToken = await this.datadisService.login(loginData.username, loginData.password)
        supplies = await this.datadisService.getAuthorizedSupplies(datadisToken, dni);
      }

    } catch (e) {
      console.log(e)
      cupsInfo.map((cups: any) => { cups.active = false; })
      return HttpResponse.success(e.toString()).withData({ cupsInfo })
    }

    cupsInfo.map(async (cups: any) => {
      let found = supplies.find((supply) => supply.cups == cups.cups)
      if (found) {
        cups.active = true;
      } else {
        console.log(cups.cups, 'cups.cups');
        let isAlive: any[] = await this.prisma.$queryRaw
        `
      SELECT *
        FROM energy_realtime 
        WHERE info_dt > (NOW() - INTERVAL 2 MINUTE) AND reference = "${cups.cups}"
      `;

        console.log(isAlive.length, 'isAlive.length');

        if (isAlive.length) {
          cups.active = true;
        } else {
          cups.active = false;
        }


      }
    })

    return HttpResponse.success("state of the cups obtained").withData({ cupsInfo })

  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT customers.id,customers.name,dni,email,balance,communities.name as community_name, shares, status FROM customers LEFT JOIN shares ON shares.customer_id = customers.id LEFT JOIN communities ON communities.id = shares.community_id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.name = data.name;
    mappedData.dni = data.dni;
    mappedData.email = data.email;
    mappedData.balance = data.balance;
    mappedData.walletAddress = data.walletAddress ? data.walletAddress.toString() : '';
    mappedData.createdAt = data.createdAt | data.created_at;
    mappedData.updatedAt = data.updatedAt | data.updated_at;

    return mappedData;
  }

  mapCustomerCupsData(unformattedData: any[]) {
    let mappedData: any[] = [];
    unformattedData.map((data: any) => {
      let mappedObject: any = {};
      mappedObject.id = data.id;
      mappedObject.name = data.name;
      mappedObject.walletAddress = data.wallet_address;
      mappedObject.balance = data.balance;
      mappedObject.createdAt = data.created_at;
      mappedObject.updatedAt = data.updated_at;
      mappedObject.communityId = data.community_id;
      mappedObject.cups = data.cups;
      mappedObject.geolocalization = data.geolocalization;
      mappedObject.customerId = data.customer_id;
      mappedObject.ubication = data.ubication;
      mappedObject.providerId = data.provider_id;
      mappedObject.communityId = data.community_id;
      mappedData.push(mappedObject);
    });
    return mappedData;
  }

}


