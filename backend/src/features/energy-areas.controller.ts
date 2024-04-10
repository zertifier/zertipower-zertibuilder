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
import { HttpUtils } from "src/shared/infrastructure/http/HttpUtils";
import { Http } from "winston/lib/winston/transports";
import axios from "axios";
import { ErrorCode } from "src/shared/domain/error/ErrorCode";
const https = require('https');

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
      let origin = 'CatastRo';

      //todo: obtener el id de la ciudad del body parameters, y postear energy_areas con location_id

      //console.log(type,m2,cadastralReference)

      try{

      const insertEnergyAreaQuery = `INSERT INTO energy_areas (origin,type,m2,cadastral_reference,geojson_feature) VALUES (?,?,?,?,?)`;
      const [result]: any[] = await this.conn.query(insertEnergyAreaQuery, [origin,type,m2,cadastralReference,JSON.stringify(geoJsonFeature)]);
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

    @Get("/simulate")
    @Auth(RESOURCE_NAME)
    async getSimulation(@Query('lat') lat: number, @Query('lng') lng: number,@Query('area') area: number, @Query('direction') direction: number, @Query('angle') angle: number, @Query('panels') panels:number) {
      console.log(lat,lng,area,direction,angle)

      const engineeringCost = 1623;
      const installationCost = [0.35, 0.3, 0.24];
      const invertersCost = [0.105, 0.087, 0.072];
      const managementCost = [1500, 1500, 2000];
      const panelsCost = 0.265;
      const structureCost = 0.07;

      try{
        const {kWp, totalProduction, numberPanels, prodByMonth, totalCost} = await calculate(lat,lng,area,direction,angle,installationCost,invertersCost,managementCost,panelsCost,structureCost,engineeringCost,panels)
        let data = {kWp, totalProduction, numberPanels, prodByMonth, totalCost}
        return HttpResponse.success("simulation executed successfully").withData(
          data
        );
      }catch(error){
        console.log("error getting energy simulation", error);
        return HttpResponse.failure("error getting energy simulation",ErrorCode.BAD_REQUEST);
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

function groupDatesByDay(data:any) {
  return data.reduce(function (result:any, item:any) {
    let key = `${item.date.getMonth()}_${item.date.getDate()}_${item.date.getHours()}`;
    (result[key] = result[key] || []).push(item.value);
    return result;
  }, {});
}

function sumValuesByMonth(data:any) {
  return data.reduce(function (result:any, item:any) {
    let key = item.date.getMonth() + 1;
    if (result[key] == null) result[key] = 0;
    result[key] += item.value;
    return result;
  }, {});
}

function convertToDateValue(item:any) {
  let dateString = item.time.substr(0, 4) + '-' +
    item.time.substr(4, 2) + '-' +
    item.time.substr(6, 2) + 'T' +
    item.time.substr(9, 2) + ':00:00Z'
  return {
    date: new Date(dateString),
    value: item["G(i)"]
  }
}

function calculateProduction(seriesCalcResult:any, pvCalcResult:any, kWp:any) {
  let year = new Date().getFullYear();
  let hourValues = seriesCalcResult.outputs.hourly.map(convertToDateValue);
  let grouped = groupDatesByDay(hourValues);
  let totalProduction = pvCalcResult.outputs.totals.fixed.E_y * kWp;

  let hourValuesAvg = [];
  let totalIrradiance = 0;
  for (const entry of Object.entries(grouped)) {

    const date = entry[0];
    const rads = entry[1] as number[];

    let split = date.split('_');
    if (split[1] === '0' || split[1] === '29') continue; // ignoramos año bisiesto
    let avg = rads.reduce((x:number, y:number) => x + y, 0) / rads.length;
    totalIrradiance += avg;
    hourValuesAvg.push({
      date: new Date(year, parseInt(split[0]), parseInt(split[1]), parseInt(split[2]), 0, 0),
      value: avg
    });

  }

  hourValuesAvg.forEach((item:any) => item.value = (item.value * totalProduction) / totalIrradiance);
  return {totalProduction, hourValuesAvg};
}

function calculateCost(kWp:any,installationCost:number[],invertersCost:number[],managementCost:number[],panelsCost:number,structureCost:number,engineeringCost:number) {
  let totalCost:any= engineeringCost;
  let stepCost = calculateStepCost(kWp);
  let watts = kWp * 1000;
  totalCost += installationCost[stepCost] * watts;
  totalCost += invertersCost[stepCost] * watts;
  totalCost += managementCost[stepCost];
  totalCost += panelsCost * watts;
  totalCost += structureCost * watts;
  totalCost += calculateCostOperatingLicense(kWp);
  totalCost += calculateAccessPointRequestAndStudyCost(kWp);

  return totalCost;
}

function calculateCostOperatingLicense(kWp:any) {
  if (kWp <= 100) return kWp * 1.1958 + 255.72;
  return kWp * 1.4218 + 229.35;
}

function calculateAccessPointRequestAndStudyCost(kWp:any) {
  if (kWp <= 10) return 0;
  return 260;
}

function calculateStepCost(kWp:any) {
  if (kWp < 7) {
    return 0;
  }
  if (kWp < 15) {
    return 1;
  }
  return 2;
}


async function calculate(lat:number, lng:number, area:number, direction:number, angle:number,installationCost:number[],invertersCost:number[],managementCost:number[],panelsCost:number,structureCost:number,engineeringCost:number,panels:number) {
  let kWp;
  if (angle < 5) { // si es plana se instala en estructura inclinada apuntando al sur
    angle = 20;
    direction = 0;
    kWp = Math.round((area * 0.8 / 9) * 10) / 10;
  }
  else {
    kWp = Math.round((area * 0.8 / 6) * 10) / 10;
  }
  let numberPanels = panels | Math.ceil(kWp / 0.45);

  let urlQueryParams = `&lat=${lat}&lon=${lng}&angle=${angle}&aspect=${direction}`;

  const pvCalc = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?peakpower=1&loss=14&mountingplace=building&outputformat=json";
  const seriesCalc = "https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?peakpower=1&loss=14&mountingplace=building&outputformat=json&startyear=2016&endyear=2020";

  let [pvCalcResult, seriesCalcResult] = await Promise.all([httpGet(pvCalc + urlQueryParams).catch(error=>{throw new Error(error);}), httpGet(seriesCalc + urlQueryParams).catch(error=>{throw new Error(error);})]);

  //console.log("pvCalcResult, seriesCalcResult",pvCalcResult, seriesCalcResult)

  let {totalProduction, hourValuesAvg} = calculateProduction(seriesCalcResult, pvCalcResult, kWp);

  let prodByMonth = sumValuesByMonth(hourValuesAvg);

  let totalCost = calculateCost(kWp,installationCost,invertersCost,managementCost,panelsCost,structureCost,engineeringCost);
  return {kWp, totalProduction, numberPanels, prodByMonth, totalCost};
}

async function httpGet(url:string) {

  return new Promise((resolve,reject) => {
    try{
    let data = ''
    https.get(url, (res:any) => {
      res.on('data', (chunk:any) => { data += chunk })
      res.on('end', () => {
        let parsedData = JSON.parse(data);
        if(parsedData.status==400){
          reject(new Error(parsedData.message));  
        }
        resolve(JSON.parse(data));
      })
      .on('error', (error: any) => {
        console.log("http error", error)
        reject(new Error(error.message));
      });
    })
  }catch(error){
    console.log("http error", error)
    reject(new Error(error.message))
  }

  })
}