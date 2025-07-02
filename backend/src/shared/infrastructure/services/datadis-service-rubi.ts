import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import * as moment from 'moment';
import * as fs from 'fs'; 
import { PasswordUtils } from "src/features/users/domain/Password/PasswordUtils";
import { LocationUtils } from "src/shared/domain/utils/locationUtils";
import { EnvironmentService } from "./environment-service";
import { EnergyHourlyService } from "./energy-houly-service";
import { LogsService } from "./logs-service";
import { CommunitiesDbRequestsService } from "src/features/communities/communities-db-requests.service";
import { CupsDbRequestsService } from "src/features/cups/cups-db-requests.service";
import { CustomersDbRequestsService } from "src/features/customers/customers-db-requests.service";

interface supply {
  address: string
  cups: string
  postalCode: string
  province: string
  municipality: string
  distributor: string
  validDateFrom: string
  validDateTo: string
  pointType: number
  distributorCode: number
  authorizedNif?: string
}

interface energyHourData {
  cups: string
  date: string
  time: string
  consumptionKWh: number
  obtainMethod: string
  surplusEnergyKWh: number
}

interface dbCups {
  id: number,
  cups: string,
  location_id: number,
  address: string,
  lng: number,
  lat: number,
  type: string,
  community_id: number,
  customer_id: number,
  datadis_active: number,
  datadis_user: string,
  datadis_password: string,
  surplus_distribution: number
}


/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class DatadisServiceRubi {

  loginData: { username: string, password: string } = { username: '', password: '' };
  token: any = undefined;
  supplies: supply[];
  dbCups: dbCups[] = [];
  dbCustomers: any[] = [];
  dbCommunities: any[] = [];
  communityCups: any[] = [];
  energyHourData: energyHourData[] = [];

  private conn: mysql.Pool;

  constructor(
    private mysql: MysqlService,
    private environmentService: EnvironmentService,
    private energyHourlyService: EnergyHourlyService,
    private cupsDbService: CupsDbRequestsService,
  ) {

    this.conn = this.mysql.pool;

    let datadisMonths: number = this.environmentService.getEnv().DATADIS_MONTHS;
    let startDate = moment().subtract(datadisMonths, 'months').format('YYYY/MM');
    let endDate = moment().format('YYYY/MM');

    this.run(startDate, endDate)

    // setInterval(() => {
    //   startDate = moment().subtract(datadisMonths, 'months').format('YYYY/MM');
    //   endDate = moment().format('YYYY/MM');
    //   this.run(startDate, endDate)
    // }, 86400000) //24 h => ms

  }

  async run(startDate: any, endDate: any) {

    this.dbCups = await this.cupsDbService.getCups()

    try {
      const token = await this.autentification();

      const supplies1 = await this.getSupplies(token, "P0818300F", "");
      const supplies11 = supplies1.map((s: any) => ({ ...s, authorizedNif: 'P0818300F' }));

      const supplies2 = await this.getSupplies(token, "A59766733", "");
      const supplies22 = supplies2.map((s: any) => ({ ...s, authorizedNif: 'A59766733' }));
      const supplies = supplies11.concat(supplies22);

      const totalData = [];
      const totalSupplies = supplies.length;
      let count = 0;
      
      for (const supply of supplies) {
        count++;
        let cupsData: any = this.dbCups.find((registeredCups: any) => registeredCups.cups === supply.cups)

        try {
          const authorizedNif = supply.authorizedNif;
          const cups = supply.cups;
          const distributorCode = supply.distributorCode;
          const measurementType = 0;
          const pointType = supply.pointType;

          const datadisCupsEnergyData = await this.getData(token, authorizedNif, cups, distributorCode, startDate, endDate, measurementType, pointType);

          let insertedEnergyDataNumber: number = await this.postCupsEnergyData(cupsData, datadisCupsEnergyData).catch(e => {
            console.log("error inserting data", e);
            return 0;
          })

          totalData.push(...datadisCupsEnergyData);
        } catch (error) {
          console.log("error getting data", error);
        }
      }

      // const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      // const filename = `datadis-energy-${timestamp}.json`;
      // fs.writeFileSync(filename, JSON.stringify(totalData, null, 2), 'utf-8');

      await this.energyHourlyService.updateEnergyHourly();

    } catch (error) {
      console.error('❌ Error en el proceso:', error.response?.data || error.message);
    }
  }

  async autentification() {
    const url = 'https://datadis.es/nikola-auth/tokens/login';
    const body = { username: process.env.DATADIS_USER, password: process.env.DATADIS_PASSWORD };
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    try {
      const res = await axios.post(url, body, { headers });
      return res.data;
    } catch (err) {
      console.error("❌ Error en la autenticación:", err.response?.data || err.message);
      throw err;
    }
  }

  async getData(token: any, authorizedNif: any, cups: any, distributorCode: any, startDate: any, endDate: any, measurementType: any, pointType: any) {
    try {
      const res = await axios.get('https://datadis.es/api-private/api/get-consumption-data', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          cups,
          distributorCode,
          startDate,
          endDate,
          measurementType,
          pointType,
          authorizedNif,
        }
      });
      
      return res.data;
    } catch (error) {
      console.error('❌ Error al obtener data:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSupplies(token: any, authorizedNif: any, distributorCode: any) {
    try {
      const res = await axios.get('https://datadis.es/api-private/api/get-supplies', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          authorizedNif,
          distributorCode
        }
      });
      
      return res.data;

    } catch (error) {
      console.error('❌ Error al obtener supplies:', error.response?.data || error.message);
      throw error;
    }
  }

  async postCupsEnergyData(cupsData: any, datadisCupsEnergyData: any[]): Promise<number> {

    //create get not inserted energy per cups query

    let dataToSearchQueryPart = ''
    let values: any = []
    let firstEnergyDate = datadisCupsEnergyData[0]
    datadisCupsEnergyData = datadisCupsEnergyData.slice(1)

    let day = moment(firstEnergyDate.date, 'YYYY/MM/DD').format('YYYY-MM-DD')
    let hour = moment(firstEnergyDate.time, 'HH:mm').format('HH:mm:ss')
    let infoDt = `${day} ${hour}`;
    let consumption = firstEnergyDate.consumptionKWh;
    let generation = firstEnergyDate.surplusEnergyKWh;

    dataToSearchQueryPart = dataToSearchQueryPart.concat(`SELECT ? as info_dt, ? as import, ? as export, ? as cups_id`)

    pushToValues(infoDt, consumption, generation, cupsData)

    for (const energy of datadisCupsEnergyData) {

      let day = moment(energy.date, 'YYYY/MM/DD').format('YYYY-MM-DD')
      let hour = moment(energy.time, 'HH:mm').format('HH:mm:ss')

      let datetime = `${day} ${hour}`;
      let energyImport = energy.consumptionKWh;
      let energyExport = energy.surplusEnergyKWh;

      pushToValues(datetime, energyImport, energyExport, cupsData)

      dataToSearchQueryPart = dataToSearchQueryPart.concat(` UNION ALL SELECT ?,?,?,? `)

    }

    let query = `
      INSERT INTO datadis_energy_registers (info_dt, import, export, cups_id)
      SELECT info_dt, import, export, cups_id
      FROM (${dataToSearchQueryPart}) AS data_to_check
      WHERE NOT EXISTS (SELECT info_dt
                        FROM datadis_energy_registers
                        WHERE datadis_energy_registers.info_dt = data_to_check.info_dt
                          AND datadis_energy_registers.cups_id = data_to_check.cups_id)
        AND cups_id = ?
    `

    //values.push(startDateFormat); values.push(endDateFormat); values.push(cupsData.id);
    values.push(cupsData.id);

    return new Promise(async (resolve, reject) => {

      try {
        //console.log(query,values)
        let [result] = await this.conn.execute<mysql.ResultSetHeader>(query, values);
        const insertedRows = result.affectedRows;
        resolve(insertedRows);
      } catch (error: any) {
        //console.log("error putting cups energy data", e);
        if (error && error.code === 'ER_WRONG_ARGUMENTS') {
          console.log('Error: Argumentos incorrectos al ejecutar la consulta MySQL.', error);
          // Realiza cualquier acción específica de manejo de errores aquí
          console.log(values)
        } else {
          // Manejo genérico de errores
          console.error('Error inesperado al ejecutar la consulta MySQL:', error);
        }
        reject(error)
      }

    })

    function pushToValues(infoDt: string, consumption: number, generation: number, cupsData: any) {
      values.push(infoDt);
      values.push(consumption);
      values.push(generation);
      values.push(cupsData.id)
    }

  }
}
