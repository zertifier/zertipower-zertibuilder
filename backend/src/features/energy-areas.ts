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
import { log } from "console";
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
  
    @Post("/geojson")
    @Auth(RESOURCE_NAME)
    async postGeojson(@Body() body: any) {
      
      //console.log("body",body)
      let geoJsonFeature = body.geoJsonFeature
      //console.log("geoJSON_feature",geoJsonFeature)
      let type = geoJsonFeature.properties.currentUse;
      let m2 = geoJsonFeature.properties.value;
      let cadastralReference = geoJsonFeature.properties.reference;

      //todo: obtener el id de la ciudad del body parameters, y postear energy_areas con location_id

      //console.log(type,m2,cadastralReference)

      try{

      const insertEnergyAreaQuery = `INSERT INTO energy_areas (type,m2,cadastral_reference,geojson_feature) VALUES (?,?,?,?)`;
      const [result]: any[] = await this.conn.query(insertEnergyAreaQuery, [type,m2,cadastralReference,JSON.stringify(geoJsonFeature)]);
      let energyAreaId=result.insertId;
        console.log(energyAreaId)
      let coordinates = geoJsonFeature.geometry.coordinates;
      coordinates = simplifyCoordinates(coordinates,energyAreaId);

      let {query,values} = createMultiplePostQuery('energy_area_coordinates',coordinates)
      await this.conn.query(query,values);

      }catch(e){
        console.log("Error with database connection",e);
        return HttpResponse.failure;
      }

      return HttpResponse.success("energyAreas posted successfully");
      
    }

    @Get("/by-location")
    async getEnergyAreasLocation(@Query('id') locationId: number) {
      try{
        const query = `SELECT * FROM energy_areas WHERE location_id=?`
        const [ROWS]: any[] = await this.conn.query(query, [locationId]);
        return HttpResponse.success("energyAreas fetched successfully").withData(
          ROWS
        );
      } catch (e:any) {
        console.log("error getting energy areas", e);
        return HttpResponse.failure;
      }
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
        return HttpResponse.failure;
      }
    }
}

const createMultiplePostQuery = (table:any, records:any) => {
  let query = 'INSERT INTO ' + table;
  let columns = [];
  let queryValues = [];
  let values = [];

  for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (i === 0) {
          // Solo para el primer registro, obtén las columnas
          columns = Object.keys(record).map((col) => camelToSnake(col));
      }

      const recordValues = Object.values(record);
      queryValues.push('(' + Array(recordValues.length).fill('?').join(', ') + ')');
      values.push(...recordValues);
  }

  query = query.concat(' (' + columns.join(', ') + ') VALUES ');
  query = query.concat(queryValues.join(', '));

  return { query, values };
};

const camelToSnake = (camelCaseString:any) => {
  return camelCaseString.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}


function simplifyCoordinates(coordinates:any[], areaId:number) {
  let simplifiedCoordinates:any = [];
  coordinates.forEach((subgroup:any) => {
      if (Array.isArray(subgroup)) {
        subgroup.forEach(coord => {
            simplifiedCoordinates.push(coord);
          });
      }
  });

  let coordenadasObj:any = [];

  
  simplifiedCoordinates[0].forEach((coord:any)=>{
      //console.log("coord:",coord)
      let obj:any = {};
      obj.lng = coord[0]
      obj.lat = coord[1]
      obj.energy_area_id=areaId;
      coordenadasObj.push(obj)
    })
  
    return coordenadasObj;
}