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
  import * as moment from "moment";
  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
  import mysql from "mysql2/promise";
  export const RESOURCE_NAME = "energy-areas";
  
  @ApiTags(RESOURCE_NAME)
  @Controller("energy-areas")
  export class EnergyAreasController {

    private conn: mysql.Pool;
    
    constructor(
      private prisma: PrismaService,
      private datatable: Datatable,
      private mysql: MysqlService
    ) {
      this.conn = this.mysql.pool;
    }
  
    @Get("/by-area")
    @Auth(RESOURCE_NAME)
    async getEnergyAreasByArea(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius: string) {
      try {
        // let url = `SELECT * FROM energy_areas LEFT JOIN energy_area_coordinates on energy_areas.id = energy_area_coordinates.energy_area_id WHERE 
        // ? IS BETWEEN lat AND lat + ? AND ? is BETWEEN lng AND lng + ? 
        // `;
        // const [ROWS]:any[] = await this.conn.query(url,[lat,radius,lng,radius]);        

        // Convertir los parámetros de consulta a números
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusNum = parseFloat(radius);

        const query = `
        SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance 
        FROM energy_areas 
        LEFT JOIN energy_area_coordinates ON energy_areas.id = energy_area_coordinates.energy_area_id 
        HAVING distance <= ?;`;
        const [ROWS]: any[] = await this.conn.query(query, [latNum, lngNum, latNum, radiusNum]);
    
        return HttpResponse.success("energyAreas fetched successfully").withData(
            ROWS
        );
      } catch (e) {
        console.log("error getting energy areas", e);
      }
    }
}