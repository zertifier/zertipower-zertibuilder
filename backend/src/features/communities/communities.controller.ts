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
import { SaveCommunitiesDTO } from "./save-communities-dto";
import * as moment from "moment";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import mysql from "mysql2/promise";

export const RESOURCE_NAME = "communities";


@ApiTags(RESOURCE_NAME)
@Controller("communities")
export class CommunitiesController {

  private conn: mysql.Pool;
  constructor(private prisma: PrismaService, private datatable: Datatable, private mysql: MysqlService) {
    this.conn = this.mysql.pool;
  }

  @Get()
  async get() {

      let url = `SELECT communities.*, count(cups.id) as cups_number FROM communities LEFT join cups ON community_id = communities.id GROUP BY communities.id`;
    const [ROWS]:any[] = await this.conn.query(url);

    //console.log("commmunities:",data);
    //const mappedData = data.map(this.mapData);
    //console.log("mappedData",mappedData);
    return HttpResponse.success("communities fetched successfully").withData(
      ROWS
    );
  }

  @Get(":id")
  @Auth(RESOURCE_NAME)
  async getById(@Param("id") id: string) {
    const data = await this.prisma.communities.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("communities fetched successfully").withData(
      this.mapData(data)
    );
  }

  @Get("/energy/:id/:date")
  @Auth(RESOURCE_NAME)
  async getByIdEnergy(@Param("id") id: number,@Param("date") date: string) {
    
    let url = `SELECT MONTHNAME(info_dt),
    SUM(import)      AS import,                 
    SUM(export)      AS export
    FROM communities 
    LEFT join cups ON community_id = communities.id 
    LEFT join datadis_energy_registers ON cups_id = cups.id
    WHERE cups.community_id = ?
    AND YEAR(info_dt) =  ?
    GROUP BY MONTH(info_dt)
    `;

    let year = moment(date,'YYYY-MM-DD').format('YYYY').toString()

    const [ROWS]:any[] = await this.conn.query(url,[id,year]);
    
    
    return HttpResponse.success("communities fetched successfully").withData(ROWS)
    
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCommunitiesDTO) {
    console.log("post community", body);
    const data = await this.prisma.communities.create({ data: body });
    return HttpResponse.success("communities saved successfully").withData(
      data
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async update(@Param("id") id: string, @Body() body: SaveCommunitiesDTO) {
    const data = await this.prisma.communities.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body,
    });
    return HttpResponse.success("communities updated successfully").withData(
      data
    );
  }

  @Delete(":id")
  @Auth(RESOURCE_NAME)
  async remove(@Param("id") id: string) {
    const data = await this.prisma.communities.delete({
      where: {
        id: parseInt(id),
      },
    });
    return HttpResponse.success("communities removed successfully").withData(
      data
    );
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT com.id,name,test,energy_price,com.lat,com.lng,com.location_id,com.created_at,com.updated_at, loc.municipality, COUNT(cups.id) qty_cups
                  FROM communities com
                  LEFT JOIN locations loc ON loc.id = com.location_id
                  LEFT JOIN cups ON com.id = community_id
                  GROUP BY com.id`
    );
    return HttpResponse.success("Datatables fetched successfully").withData(
      data
    );
  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.name = data.name;
    mappedData.test = data.test;
    mappedData.geolocation=data.geolocation;
    mappedData.energyPrice=data.energyPrice;
    mappedData.createdAt = data.createdAt;
    mappedData.updatedAt = data.updatedAt;
    return mappedData;
  }
}
