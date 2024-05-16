import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import * as moment from 'moment';
import { PasswordUtils } from "src/features/users/domain/Password/PasswordUtils";
import { LocationUtils } from "src/shared/domain/utils/locationUtils";
import { PrismaService } from "./prisma-service";


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
export class DatadisService {

  loginData = { username: 'g67684878', password: 'acEM2020!' }
  token: any = undefined;
  supplies: supply[];
  dbCups: dbCups[] = [];
  dbCustomers: any[] = [];
  dbCommunities: any[] = [];
  communityCups: any[] = [];
  energyHourData: energyHourData[] = [];

  private conn: mysql.Pool;

  constructor(private mysql: MysqlService, private prisma: PrismaService) {

    this.conn = this.mysql.pool;

    let startDate = moment().subtract(1, 'months').format('YYYY/MM'); //moment().subtract(1, 'weeks').format('YYYY/MM');
    let endDate = moment().format('YYYY/MM'); //moment().format('YYYY/MM');

    this.run(startDate, endDate)

    setInterval(() => {
      startDate = moment().subtract(1, 'months').format('YYYY/MM');
      endDate = moment().format('YYYY/MM');
      this.run(startDate, endDate)
    }, 86400000) //24 h => ms

  }

  async run(startDate: any, endDate: any) {

    let status = 'success';
    let errorType = '';
    let errorMessage = '';
    let operation = 'insert datadis data';

    this.dbCups = await this.getCups()
    this.dbCustomers = await this.getCustomers();
    this.dbCommunities = await this.getCommunities();
    for (let cups of this.dbCups) {
      if (!cups.datadis_active || !cups.datadis_user || !cups.datadis_password) {
        continue;
      }

      this.loginData.username = cups.datadis_user;
      this.loginData.password = PasswordUtils.decryptData(cups.datadis_password, process.env.JWT_SECRET!);

      //get auth token
      await this.login(this.loginData.username, this.loginData.password).catch(async e => {
        console.log(e)
        status = 'error';
        errorType = 'Error getting token';
        operation = 'Get token';
        await this.postLogs(cups.cups, cups.id, operation, 0, startDate, endDate, null, null, status, errorType, errorMessage);
        return;
      });

      //get datadis cups
      await this.getSupplies(this.token).catch(async e => {
        status = 'error';
        errorType = 'Error getting supplies';
        operation = 'Get supplies'
        await this.postLogs(cups.cups, cups.id, operation, 0, startDate, endDate, null, null, status, errorType, errorMessage);
      });

      if (!this.supplies) {
        continue;
      }

      //check if all cups are in database already
      await this.checkCups();

      //get community authorized cups
      this.communityCups = [];
      if (cups.type == 'community') {

        this.dbCups.map((dbCupsElement) => {
          //if dbCups has the same communty of cups but it isn't the same
          if (dbCupsElement.community_id === cups.community_id && dbCupsElement.id != cups.id) {

            //get customer that own the cups
            let customerFound = this.dbCustomers.find(dbCustomer => dbCustomer.id === dbCupsElement.customer_id)

            //if the customer has a dni
            if (customerFound && customerFound.dni) {
              this.communityCups.push({ ...customerFound, ...dbCupsElement })
            }
          }
        })
      }

      //get authorized community datadis cups
      const authorizedSuppliesPromises = this.communityCups.map(communityCupsElement => this.getAuthorizedSupplies(this.token, communityCupsElement.dni));
      try {
        await Promise.all(authorizedSuppliesPromises);
      } catch (e) {
        status = 'error';
        errorType = 'Error getting authorized supplies';
        operation = 'Get authorized supplies'
        await this.postLogs(cups.cups, cups.id, operation, 0, startDate, endDate, null, null, status, errorType, errorMessage);
      }

      //go across cups:
      for (const supply of this.supplies) {

        status = 'success';
        errorType = '';
        errorMessage = '';
        operation = 'register datadis energy data';

        let cupsData: any = this.dbCups.find((registeredCups: any) => registeredCups.cups === supply.cups)

        if (!cupsData) {
          console.log("Error cups data not found on db : ", supply.cups)
          status = 'error';
          errorType = 'Error cups data not found on db';
          operation = 'Find cups data register by datadis supply.cups'
          await this.postLogs(supply.cups, cupsData.id, operation, 0, startDate, endDate, null, null, status, errorType, errorMessage)
          continue;
        }

        let getDatadisBegginningDate = moment().format("DD-MM-YYYY HH:mm:ss");

        //obtain datadis hour energy:
        let datadisCupsEnergyData: any = await this.getConsumptionData(supply.cups, supply.distributorCode, startDate, endDate, 0, supply.pointType, supply.authorizedNif).catch(async (e) => {
          let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");
          status = 'error';
          errorType = "datadis request error";
          errorMessage = e.toString().substring(0, 200)
          operation = "get datadis hourly energy registers"
          await this.postLogs(supply.cups, cupsData.id, operation, 0, startDate, endDate, getDatadisBegginningDate, getDatadisEndingDate, status, errorType, errorMessage)
          return null;
        })

        if (!datadisCupsEnergyData) {
          console.log("no datadisCupsEnergyData ", datadisCupsEnergyData, ". Continue")
          status = 'error';
          errorType = 'no datadis cups energy data';
          operation = 'Get energy data from datadis (https://datadis.es/api-private/api/get-consumption-data)'
          await this.postLogs(supply.cups, cupsData.id, operation, 0, startDate, endDate, null, null, status, errorType, errorMessage)
          continue;
        }

        let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");

        //get cups energy hours db registers
        let insertedEnergyDataNumber: number = await this.postCupsEnergyData(cupsData, datadisCupsEnergyData, startDate, endDate).catch(e => {
          status = 'error';
          errorType = "post datadis data error";
          errorMessage = e.toString().substring(0, 200);
          operation = "post datadis hourly energy registers data into database (datadis table)";
          return 0;
        })

        //insert readed cups energy hours
        await this.postLogs(supply.cups, cupsData.id, operation, insertedEnergyDataNumber, startDate, endDate, getDatadisBegginningDate, getDatadisEndingDate, status, errorType, errorMessage)

      }
    }

    const newRegisters: any = await this.getNewDatadisRegisters()
    this.insertNewRegistersToEnergyHourly(newRegisters)
  }

  async login(username: string, password: string) {

    this.loginData = { username, password }

    let config = {
      method: 'post',
      url: 'https://datadis.es/nikola-auth/tokens/login',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: this.loginData
    }
    return new Promise(async (resolve, reject) => {
      let response: any = await axios.request(config).catch((e: any) => {
        console.log('error logging in', e)
        reject(e);
      });
      console.log("login success, token obtained")
      if (response) {
        this.token = response.data;
        resolve(this.token);
      } else {
        reject("error getting token");
      }
    })
  }

  async getSupplies(token: string) {

    this.token = token;

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://datadis.es/api-private/api/get-supplies',
      headers: { 'Authorization': `Bearer ${this.token}` },
      timeout: 20000
    }
    try {
      let response: any = await axios.request(config)
      this.supplies = response.data
      return this.supplies;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError: any = error;

        if (axiosError.response) {
          console.error('Respuesta recibida con estado:', axiosError.response.status);
          console.error('Datos de respuesta:', axiosError.response.data);
        } else if (axiosError.request) {
          // El error ocurrió durante la solicitud, pero no se recibió respuesta
          console.error('La solicitud no recibió respuesta');
        } else {
          // Error al configurar la solicitud
          console.error('Error al configurar la solicitud:', axiosError.message);
        }
      } else {

        console.error('Ocurrió un error:', error.message);
      }
      throw new Error('No se pudieron obtener los suministros');
    }
  }

  async getAuthorizedSupplies(token: string, dni: string) {

    this.token = token;

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://datadis.es/api-private/api/get-supplies?authorizedNif=${dni}`,
      headers: { 'Authorization': `Bearer ${this.token}` },
      timeout: 20000
    }
    try {
      let response: any = await axios.request(config)
      //add authorized nif to supplies:
      response.data.map((supplies: any) => {
        supplies.authorizedNif = dni
      })
      //add supplies:
      this.supplies = this.supplies.concat(response.data)
      return this.supplies;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError: any = error;
        if (axiosError.response) {
          console.error('Respuesta recibida con estado:', axiosError.response.status);
          console.error('Datos de respuesta:', axiosError.response.data);
        } else if (axiosError.request) {
          // El error ocurrió durante la solicitud, pero no se recibió respuesta
          console.error('La solicitud no recibió respuesta',);
        } else {
          // Error al configurar la solicitud
          console.error('Error al configurar la solicitud:', axiosError.message);
        }
      } else {
        console.error('Ocurrió un error:', error.message);
      }
      console.log("error obteniendo suministros autorizados")
      throw new Error('No se pudieron obtener los suministros');
    }
  }

  /**
   *
   * @param cups
   * @param distributorCode
   * @param startDate
   * @param endDate
   * @param meeasurementType
   * @param pointType
   */
  async getConsumptionData(cups: string, distributorCode: number, startDate: string, endDate: string, measurementType: number, pointType: number, authorizedNif?: string) {

    //console.log("try to get datadis data: ",cups,distributorCode,startDate,endDate,0,pointType,authorizedNif)

    return new Promise(async (resolve, reject) => {

      try {

        const baseUrl = authorizedNif ?
          `https://datadis.es/api-private/api/get-consumption-data?authorizedNif=${authorizedNif}&`
          : 'https://datadis.es/api-private/api/get-consumption-data?';

        let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `${baseUrl}cups=${cups}&distributorCode=${distributorCode}&startDate=${startDate}&endDate=${endDate}&measurementType=${measurementType}&pointType=${pointType}`,
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept-Encoding': 'gzip, deflate, br, zlib',
            'Accept': '*/*'
          },
          timeout: 20000
        };

        let response = await axios.request(config);

        if (!response) {
          console.log("Get consumption data unknown error. Undefined response.");
          reject('Unknown error occurred');
        } else {
          console.log("response get consumption data from cups ", cups, " : ", response);
          resolve(response.data);
        }
      } catch (error) {
        if (error.response) {
          console.error("Error getting consumption data from cups ", cups, " (data): ", error.response.data);
          reject(error.response.data);
        } else if (error.request) {
          console.error("Error getting consumption data from cups ", cups, " (request)", error.code);
          reject(error.code);
        } else {
          console.error("Error getting consumption data from cups ", cups, " (error): ", error);
          reject(error);
        }
      }

    })
  }

  async getCups(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const getCupsQuery = `SELECT *
                              FROM cups`;
        let [ROWS]: any = await this.conn.query(getCupsQuery);
        resolve(ROWS);
      } catch (e) {
        console.log("error getting cups", e);
        reject(e)
      }
    })
  }

  async getCustomers(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const getCustomersQuery = `SELECT *
                                   FROM customers`;
        let [ROWS]: any = await this.conn.query(getCustomersQuery);
        resolve(ROWS);
      } catch (e) {
        console.log("error getting customers", e);
        reject(e)
      }
    })
  }

  async getCommunities(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const getCommunitiesQuery: string = `SELECT *
                                     FROM communities`;
        let [ROWS]: any = await this.conn.query(getCommunitiesQuery);
        resolve(ROWS);
      } catch (e) {
        console.log("error getting communities", e);
        reject(e)
      }
    })
  }


  async checkCups(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {

        const getLocationQuery = `SELECT *
                                  FROM locations
                                  WHERE province = ?
                                    AND municipality = ?`;
        const insertCupsQuery = `INSERT INTO cups (cups, location_id, address)
                                 VALUES (?, ?, ?)`; //,datadis_user,datadis_password
        const insertCupsQueryLatLng = `INSERT INTO cups (cups, location_id, address, lat, lng)
                                       VALUES (?, ?, ?, ?, ?)`; //datadis_user,datadis_password
        const insertLocationQuery = `INSERT INTO locations (province, municipality)
                                     VALUES (?, ?)`;
        let locationId;
        let coordinates: any = {};

        this.supplies.map(async cupsData => {
          let dbFound = this.dbCups.find((registeredCups: any) => registeredCups.cups === cupsData.cups)

          //insert cups if it isn't already registered
          if (!dbFound) {
            console.log("try to insert new cups: ", cupsData);
            //get or set location
            const [ROWS]: any = await this.conn.query(getLocationQuery, [cupsData.province, cupsData.municipality])
            if (ROWS[0]) {
              locationId = ROWS[0].id
            } else {
              //insert location if it isn't already registered
              console.log("try to insert new location: ", cupsData.province, cupsData.municipality);
              const [result]: any = await this.conn.query(insertLocationQuery, [cupsData.province, cupsData.municipality])
              locationId = result.insertId;
            }

            //let datadisEncriptedPassword = PasswordUtils.encryptData(this.loginData.password,process.env.JWT_SECRET!)

            try {
              //get cups geolocation
              let { lat, lng } = await LocationUtils.getCoordinates(cupsData.address, cupsData.municipality)
              coordinates = { lat, lng }
              //post cups with geolocation
              await this.conn.query(insertCupsQueryLatLng, [cupsData.cups, locationId, cupsData.address, coordinates.lat, coordinates.lng]); //this.loginData.username,datadisEncriptedPassword
            } catch (e) {
              console.log("error getting geolocation", cupsData.address, cupsData.municipality, e)
              //post cups without geolocation
              await this.conn.query(insertCupsQuery, [cupsData.cups, locationId, cupsData.address]); //this.loginData.username,datadisEncriptedPassword
            }
          }
        })

        //update dbCups during dbCups iteration is  problem,
        //we can push new values or wait to next iteration

        //this.dbCups = await this.getCups()

        resolve(this.dbCups);
      } catch (e: any) {
        console.log("error checking cups", e);
        reject(e)

      }
    })
  }

  async postCupsEnergyData(cupsData: any, datadisCupsEnergyData: any[], startDate: string, endDate: string): Promise<number> {

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

    let startDateFormat = moment(startDate, 'YYYY/MM').format('YYYY-MM-DD HH:mm:ss');
    let endDateFormat = moment(endDate, 'YYYY/MM').format('YYYY-MM-DD HH:mm:ss');

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

  postLogs(cups: string, cupsId: number, operation: string, n_registers: number, startDate: any, endDate: any, getDatadisBegginningDate: any, getDatadisEndingDate: any, status: string, errorType: string, errorMessage: string) {

    const log = {
      cups,
      n_registers,
      startDate,
      endDate,
      status: status,
      errorType,
      errorMessage,
      getDatadisBegginningDate,
      getDatadisEndingDate
    };

    const insertLogQuery = `INSERT INTO logs (origin, log, cups, cups_id, status, operation, n_affected_registers,
                                              error_message)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    return new Promise(async (resolve, reject) => {
      try {
        let [ROWS] = await this.conn.query(insertLogQuery, ['datadis', JSON.stringify(log), cups, cupsId, status, operation, n_registers, errorMessage]);
        resolve(ROWS);
      } catch (e: any) {
        console.log("error inserting logs energy data", e);
        reject(e)
      }
    })
  }

  async getNewDatadisRegisters() {

    return new Promise(async resolve => {
      let query = `
        SELECT d.*, cups.type, cups.surplus_distribution, cups.community_id
        FROM datadis_energy_registers d
               LEFT JOIN energy_hourly e ON d.info_dt = e.info_dt
               LEFT JOIN cups ON d.cups_id = cups.id
        WHERE e.info_dt IS NULL ;
      `
      let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }


  async insertNewRegistersToEnergyHourly(datadisNewRegisters: any[]) {
    const communities = await this.getCommunities()

    for (const community of communities) {
      let datadisRegistersByCommunity = datadisNewRegisters.filter(obj => obj.community_id === community.id);
      const communityCups = datadisRegistersByCommunity.filter(obj => obj.type === 'community');

      if (datadisNewRegisters) datadisRegistersByCommunity = this.orderArrByInfoDt(datadisNewRegisters)

      const allCupsOfCommunity = await this.getCupsByCommunity(community.id)
      const filteredCups = allCupsOfCommunity.length > 0 ?
        this.orderArrByInfoDt(datadisRegistersByCommunity.concat(this.addNotProvidedCups(datadisNewRegisters, allCupsOfCommunity))) : []

      // Define the batch size
      const batchSize = 4000;
      // const batchSize = 99;

      // Iterate over the filteredCups array in batches
      for (let start = 0; start < filteredCups.length; start += batchSize) {
      // for (let start = 0; start < 100; start += batchSize) {
        // Extract a slice of batchSize from filteredCups
        const batch = filteredCups.slice(start, start + batchSize);

        // Construct the query for this batch
        let query = 'INSERT INTO energy_hourly (info_dt, kwh_in, kwh_out, production, cups_id, origin, battery, shares) VALUES ';

        for (let i = 0; i < batch.length; i++) {
          const datadisRegister = batch[i];

          if (datadisRegister.surplus_distribution) {
            const communityExport = communityCups.find(obj => moment(obj.info_dt).format('YYYY-MM-DD HH:mm') == moment(datadisRegister.info_dt).format('YYYY-MM-DD HH:mm'));
            const production = communityExport ? datadisRegister.surplus_distribution * communityExport.export : null;
            // const consumption = (production && datadisRegister.import) ? production + datadisRegister.import : datadisRegister.import;
            let consumption = null;

            if (production && datadisRegister.import){
              consumption = production + datadisRegister.import
            }else{
              if (production && datadisRegister.export){
                consumption = production - datadisRegister.export
              }else{
                consumption = datadisRegister.import
              }
            }


            query +=
              `("${moment(datadisRegister.info_dt).format('YYYY-MM-DD HH:mm:ss')}" , ${consumption} , ${datadisRegister.export}, ${production} , ${datadisRegister.cups_id} , 'datadis', 0, ${datadisRegister.surplus_distribution || null}),`;
          } else {
            query +=
              `("${moment(datadisRegister.info_dt).format('YYYY-MM-DD HH:mm:ss')}" , ${datadisRegister.import} , ${datadisRegister.export}, ${null} , ${datadisRegister.cups_id} , 'datadis', ${null}, ${null}),`;
          }
        }

        // Remove the trailing comma from the query
        query = query.slice(0, -1);
        // console.log(query)

        if (filteredCups.length){
          // Execute the query for this batch
          let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
          const insertedRows = result.affectedRows;
          console.log(`Energy hourly of community ${community.id} updated with a total of ${insertedRows} rows for batch starting at index ${start}`);
        }

      }
    }

    this.getTransactionsWithNullPrice().then(async (transactions) => {
      console.log("Updating", transactions.length, "transactions...")
      for (const transaction of transactions) {
        const energyData = await this.getEnergyPrice(new Date(transaction.info_dt!), transaction.provider_id)
        // transaction.kwhInPrice = energyData.price * transaction.kwhIn
        transaction.kwh_in_price = energyData.price
        // transaction.kwhOutPrice = energyData.price * transaction.kwhOut
        transaction.kwh_out_price = 0.06
        transaction.kwh_in_price_community = 0.09
        transaction.kwh_out_price_community = 0.09
        transaction.type = energyData.rate

        this.updatePrices(transaction)
      }
    })
  }


  async getTransactionsWithNullPrice() {
    const transactionsWithNullPrice: any = await this.prisma.$queryRaw`
      SELECT eh.*, cups.community_id, cups.provider_id
      FROM energy_hourly eh
             LEFT JOIN cups ON eh.cups_id = cups.id
      WHERE eh.kwh_in_price IS NULL
         OR eh.kwh_out_price IS NULL;
    `


    return transactionsWithNullPrice;
  }


  async getEnergyPrice(date: Date, providerId: number) {
    let formattedDate = moment(date).format('YYYY-MM-DD')
    let price, energyBlockData: any[];

    try {

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

        energyBlockData = await this.prisma.$queryRaw`
          SELECT *
          FROM energy_blocks
          WHERE active_init <= ${formattedDate}
            AND active_end >= ${formattedDate}
            AND provider_id = ${providerId};
        `
        if (energyBlockData.length) {

          const consumptionPrice = energyBlockData[0] ? energyBlockData[0].consumption_price : 0
          price = consumptionPrice
          data.rate = energyBlockData[0].reference || ''
          data.price = price
          return data

        }

      } else {
        data.price = nonWorkingDayData.price || 0
        data.rate = nonWorkingDayData.rate || ''
      }

      return data

    } catch (e) {
      throw new Error(`Get energy price error: energyBlockData",${energyBlockData!},"providerId",${providerId},"formattedDate",${formattedDate},${e}`)
    }

  }

  async getCupsByCommunity(communityId: number) {
    return await this.prisma.cups.findMany({
      where: {
        communityId
      }
    });
  }

  async updatePrices(data: any) {
    await this.prisma.energyHourly.update({
      where: {
        id: parseInt(data.id),
      },
      data: {
        kwhInPrice: data.kwh_in_price,
        kwhOutPrice: data.kwh_out_price,
        kwhOutVirtual: data.kwh_out,
        type: data.type,
      },
    })
  }


  addNotProvidedCups(existentDatadisCups: any[], allDbCups: any[]) {
    if (allDbCups.length === 0) {
      return [];
    }

    const existingCupsIds = existentDatadisCups.map(cup => cup.cups_id);
    const newCups = allDbCups.filter(cup => !existingCupsIds.includes(cup.id));

    if (!newCups.length) return []

    const formattedNewCups: any = []

    let lastCheckedDate = null

    for (const existentCups of existentDatadisCups) {
      if (lastCheckedDate != moment(existentCups.info_dt).format('YYYY-MM-DD HH:mm:ss')){
        formattedNewCups.push(...this.formatNewCups(newCups, existentCups))
        lastCheckedDate = moment(existentCups.info_dt).format('YYYY-MM-DD HH:mm:ss')
      }

    }

    return formattedNewCups
  }

  formatNewCups(newCups: any[], existentCups: any) {
    const formattedCups = []
    for (const cups of newCups) {
      formattedCups.push({
        cups_id: cups.id,
        info_dt: existentCups.info_dt,
        import: null,
        export: null,
        /*import: cups.type == 'community' ? existentCups.import : null,
        export: cups.type == 'community' ? existentCups.export : null,*/
        surplus_distribution: cups.surplusDistribution || null,
        community_id: cups.communityId,
        type: cups.type,
        transaction_id: null,
        battery: 0,
        tx_import: null,
        tx_export: null,
        smart_contracts_version: 0
      })
    }

    return formattedCups
  }

  orderArrByInfoDt(array: any[]) {
    return array.sort((a: any, b: any) => a.info_dt - b.info_dt);
  }
}
