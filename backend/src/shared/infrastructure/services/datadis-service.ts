import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import * as moment from 'moment';
import { throwError } from "rxjs";
import { PasswordUtils } from "src/features/users/domain/Password/PasswordUtils";
import { LocationUtils } from "src/shared/domain/utils/locationUtils";
import { log } from "console";


interface supply {
    address : string
    cups : string
    postalCode : string
    province : string
    municipality : string
    distributor : string
    validDateFrom : string
    validDateTo : string
    pointType : number
    distributorCode : number
    authorizedNif?: string
  } 

interface energyHourData {
    cups : string
    date : string
    time : string
    consumptionKWh : number
    obtainMethod : string
    surplusEnergyKWh : number
}

interface dbCups {
    id: number,
    cups : string,
    location_id : number,
    address : string,
    lng: number,
    lat: number,
    type:string,
    community_id: number,
    customer_id:number,
    datadis_active: number,
    datadis_user:string,
    datadis_password:string,
    surplus_distribution: number
}


/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class DatadisService {

    loginData = {username:'g67684878',password:'acEM2020!'}
    token:any=undefined;
    supplies:supply[];
    dbCups:dbCups[]=[];
    dbCustomers:any[]=[];
    dbCommunities:any[]=[];
    communityCups:any[]=[];
    energyHourData:energyHourData[]=[];

    private conn: mysql.Pool;

    constructor(private mysql: MysqlService){

        this.conn = this.mysql.pool; 
        
        let startDate= moment().subtract(1, 'months').format('YYYY/MM'); //moment().subtract(1, 'weeks').format('YYYY/MM'); 
        let endDate= moment().format('YYYY/MM'); //moment().format('YYYY/MM');

        console.log(startDate,endDate)
        
        this.run(startDate,endDate)

        setInterval(()=>{
            startDate= moment().subtract(1, 'months').format('YYYY/MM');
            endDate= moment().format('YYYY/MM');
            this.run(startDate,endDate)
        },86400000) //24 h => ms

    }

    async run(startDate:any,endDate:any){

        let status = 'success';
        let errorType = '';
        let errorMessage = '';
        let operation = 'insert datadis data';

        this.dbCups = await this.getCups()
        this.dbCustomers = await this.getCustomers();
        this.dbCommunities = await this.getCommunities();
        
        for (let cups of this.dbCups) {

            if(!cups.datadis_active || !cups.datadis_user || !cups.datadis_password){
                continue;
            }

            this.communityCups = [];
            
            if(cups.type == 'community'){
                 this.dbCups.map((dbCupsElement)=>{
                    if(dbCupsElement.community_id===cups.community_id){
                        let customerFound = this.dbCustomers.find(dbCustomer=>dbCustomer.id===cups.customer_id)
                        if(customerFound && customerFound.dni){
                            this.communityCups.push({...customerFound,...dbCupsElement})
                        }
                    }
                })
            }

            this.loginData.username=cups.datadis_user;
            this.loginData.password= PasswordUtils.decryptData(cups.datadis_password,process.env.JWT_SECRET!);

            //get auth token
            await this.login();

            //get datadis cups
            await this.getSupplies();

            //get authorized community datadis cups 
            this.communityCups.map(async (communityCupsElement)=>{
                await this.getAuthorizedSupplies(communityCupsElement);
            })

            //check if all cups are in database already
            await this.checkCups();

            //go across cups:
            for (const supply of this.supplies){

                status = 'success';
                errorType = '';
                errorMessage = '';
                operation = 'register datadis energy data';

                let cupsData:any = this.dbCups.find((registeredCups:any)=>registeredCups.cups===supply.cups)

                if(!cupsData){
                    console.log("Error cups data not found on db : " , supply.cups)
                    status = 'error';
                    errorType = 'Error cups data not found on db';
                    operation = 'Find cups data register by datadis supply.cups'
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,null,null,status,errorType,errorMessage)
                    continue;
                }

                let getDatadisBegginningDate = moment().format("DD-MM-YYYY HH:mm:ss");

                //obtain datadis hour energy:
                let datadisCupsEnergyData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,startDate,endDate,0,supply.pointType,supply.authorizedNif).catch(async (e)=>{
                    let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");
                    status='error';
                    errorType="datadis request error";
                    errorMessage=e.toString().substring(0,200)
                    operation="get datadis hourly energy registers"
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,getDatadisBegginningDate,getDatadisEndingDate,status,errorType,errorMessage)
                    return null;
                })

                if(!datadisCupsEnergyData){
                    console.log("no datadisCupsEnergyData ",datadisCupsEnergyData, ". Continue")
                    status = 'error';
                    errorType = 'no datadis cups energy data';
                    operation = 'Get energy data from datadis (https://datadis.es/api-private/api/get-consumption-data)'
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,null,null,status,errorType,errorMessage)
                    continue;
                }

                let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");

                //get cups energy hours db registers 
                let insertedEnergyDataNumber:number = await this.postCupsEnergyData(cupsData,datadisCupsEnergyData,startDate,endDate).catch(e=>{
                    status='error';
                    errorType="post datadis data error";
                    errorMessage=e.toString().substring(0,200);
                    operation="post datadis hourly energy registers data into database";
                    return 0;
                })

                //insert readed cups energy hours 
                await this.postLogs(supply.cups,cupsData.id,operation,insertedEnergyDataNumber,startDate,endDate,getDatadisBegginningDate,getDatadisEndingDate,status,errorType,errorMessage)

            }
        }
    }

    async login(){
        let config = {method:'post', url: 'https://datadis.es/nikola-auth/tokens/login', headers: { 'Content-Type': 'application/x-www-form-urlencoded'}, data:this.loginData}
        return new Promise(async (resolve,reject)=>{
            let response:any = await axios.request(config).catch((e:any)=>{
                console.log('error logging in', e)
                reject(e);
            });
            console.log("login success, token obtained")
            this.token = response.data;
            resolve(this.token);
        })
    }

    async getSupplies(){
        let config = {
            method:'get', 
            maxBodyLength: Infinity, 
            url: 'https://datadis.es/api-private/api/get-supplies', 
            headers: {'Authorization': `Bearer ${this.token}`}
        }
        try{
            let response:any = await axios.request(config)
            this.supplies=response.data
            return this.supplies;
        }catch(error){
            if (axios.isAxiosError(error)) {
                const axiosError: any = error;
             
                if (axiosError.response) {
                    console.error('Respuesta recibida con estado:', axiosError.response.status);
                    console.error('Datos de respuesta:', axiosError.response.data);
                } else if (axiosError.request) {
                    // El error ocurrió durante la solicitud, pero no se recibió respuesta
                    console.error('La solicitud no recibió respuesta:', axiosError.request);
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

    async getAuthorizedSupplies(communityCupsElement:any){
        let config = {
            method:'get', 
            maxBodyLength: Infinity, 
            url: `https://datadis.es/api-private/api/get-supplies?authorizedNif=${communityCupsElement.dni}`, 
            headers: {'Authorization': `Bearer ${this.token}`}
        }
        try{
            let response:any = await axios.request(config)
            //add authorized nif to supplies:
            response.data.map((supplies:any)=>{
                supplies.authorizedNif = communityCupsElement.dni
            })
            //add supplies:
            this.supplies=this.supplies.concat(response.data)
            return this.supplies;
        }catch(error){
            if (axios.isAxiosError(error)) {
                const axiosError: any = error;
             
                if (axiosError.response) {
                    console.error('Respuesta recibida con estado:', axiosError.response.status);
                    console.error('Datos de respuesta:', axiosError.response.data);
                } else if (axiosError.request) {
                    // El error ocurrió durante la solicitud, pero no se recibió respuesta
                    console.error('La solicitud no recibió respuesta:', axiosError.request);
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

    /**
     * 
     * @param cups 
     * @param distributorCode 
     * @param startDate 
     * @param endDate 
     * @param meeasurementType 
     * @param pointType 
     */
    async getConsumptionData(cups:string,distributorCode:number,startDate:string,endDate:string,measurementType:number,pointType:number,authorizedNif?:string){

        console.log("try to get datadis data: ",cups,distributorCode,startDate,endDate,0,pointType,authorizedNif)

        return new Promise(async (resolve,reject)=>{

            try {

                const baseUrl = authorizedNif ? 
                `https://datadis.es/api-private/api/get-consumption-data?authorizedNif=${authorizedNif}&`
                :'https://datadis.es/api-private/api/get-consumption-data?';
    
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${baseUrl}cups=${cups}&distributorCode=${distributorCode}&startDate=${startDate}&endDate=${endDate}&measurementType=${measurementType}&pointType=${pointType}`,
                    headers: { 
                        'Authorization': `Bearer ${this.token}`,
                        'Accept-Encoding': 'gzip, deflate, br, zlib',
                        'Accept':'*/*'
                    }
                };
    
                let response = await axios.request(config);
                
                if (!response) {
                    console.log("Get consumption data unknown error. Undefined response.");
                    reject('Unknown error occurred');
                } else {
                    console.log("response get consumption data from cups ",cups," : ",response);
                    resolve(response.data);
                }
            } catch (error) {
                if(error.response){
                    console.error("Error getting consumption data from cups ",cups ," (data): ", error.response.data);
                    reject(error.response.data); 
                } else if(error.request) {
                    console.error("Error getting consumption data from cups ",cups ," (request)",error.code);
                    reject(error.code); 
                } else {
                    console.error("Error getting consumption data from cups ",cups ," (error): ", error);
                    reject(error); 
                }
            }
            
        })
    }

    async getCups():Promise<any>{
        return new Promise(async (resolve,reject)=>{
            try{
                const getCupsQuery = `SELECT * FROM cups`;
                let [ROWS]:any = await this.conn.query(getCupsQuery);
                resolve(ROWS);
            }catch(e){
                console.log("error getting cups", e);
                reject(e)
            }
        })
    }

    async getCustomers():Promise<any>{
        return new Promise(async (resolve,reject)=>{
            try{
                const getCustomersQuery = `SELECT * FROM customers`;
                let [ROWS]:any = await this.conn.query(getCustomersQuery);
                resolve(ROWS);
            }catch(e){
                console.log("error getting customers", e);
                reject(e)
            }
        })
    }

    async getCommunities():Promise<any>{
        return new Promise(async (resolve,reject)=>{
            try{
                const getCommunitiesQuery = `SELECT * FROM communities`;
                let [ROWS]:any = await this.conn.query(getCommunitiesQuery);
                resolve(ROWS);
            }catch(e){
                console.log("error getting communities", e);
                reject(e)
            }
        })
    }


    async checkCups():Promise<any>{
        return new Promise(async (resolve,reject)=>{
        try{
            
            const getLocationQuery = `SELECT * FROM locations WHERE province = ? AND municipality = ?`;
            const insertCupsQuery = `INSERT INTO cups (cups,location_id,address) VALUES (?,?,?)`; //,datadis_user,datadis_password
            const insertCupsQueryLatLng = `INSERT INTO cups (cups,location_id,address,lat, lng) VALUES (?,?,?,?,?)`; //datadis_user,datadis_password
            const insertLocationQuery = `INSERT INTO locations (province,municipality) VALUES (?,?)`;
            let locationId;
            let coordinates:any = {};
            
            this.supplies.map(async cupsData => {
                let dbFound = this.dbCups.find((registeredCups:any)=>registeredCups.cups===cupsData.cups)
                
                //insert cups if it isn't already registered
                if(!dbFound){
                    console.log("try to insert new cups: ", cupsData);

                    //get or set location
                    const [ROWS]:any = await this.conn.query(getLocationQuery,[cupsData.province,cupsData.municipality])
                    if(ROWS[0]){
                        locationId = ROWS[0].id
                    } else {
                        //insert location if it isn't already registered
                        console.log("try to insert new location: ", cupsData.province,cupsData.municipality);
                        const [result]:any = await this.conn.query(insertLocationQuery,[cupsData.province,cupsData.municipality])
                        locationId = result.insertId;
                    }

                    //let datadisEncriptedPassword = PasswordUtils.encryptData(this.loginData.password,process.env.JWT_SECRET!)
                    
                     try {
                        //get cups geolocation
                        let {lat,lng} = await LocationUtils.getCoordinates(cupsData.address,cupsData.municipality)
                        coordinates = {lat,lng}
                        //post cups with geolocation
                        await this.conn.query(insertCupsQueryLatLng,[cupsData.cups,locationId,cupsData.address,coordinates.lat,coordinates.lng]); //this.loginData.username,datadisEncriptedPassword
                     } catch(e){
                        console.log("error getting geolocation", cupsData.address,cupsData.municipality, e)
                        //post cups without geolocation
                        await this.conn.query(insertCupsQuery,[cupsData.cups,locationId,cupsData.address]); //this.loginData.username,datadisEncriptedPassword
                     }   
                }
            })

            //update dbCups during dbCups iteration is  problem,
            //we can push new values or wait to next iteration

            //this.dbCups = await this.getCups()

            resolve(this.dbCups);
          } catch (e:any) {
            console.log("error checking cups", e);
            reject(e)
           
          }
        })
    }

    async postCupsEnergyData(cupsData:any,datadisCupsEnergyData:any[],startDate:string,endDate:string): Promise<number>{

        //create get not inserted energy per cups query

        let dataToSearchQueryPart = ''
        let values:any = []
        let firstEnergyDate = datadisCupsEnergyData[0]
        datadisCupsEnergyData = datadisCupsEnergyData.slice(1)
        
        let day = moment(firstEnergyDate.date,'YYYY/MM/DD').format('YYYY-MM-DD')
        let hour = moment(firstEnergyDate.time,'HH:mm').format('HH:mm:ss') 
        let infoDt = `${day} ${hour}`;
        let consumption = firstEnergyDate.consumptionKWh;
        let generation = firstEnergyDate.surplusEnergyKWh;

        let startDateFormat=moment(startDate,'YYYY/MM').format('YYYY-MM-DD HH:mm:ss');
        let endDateFormat=moment(endDate,'YYYY/MM').format('YYYY-MM-DD HH:mm:ss');

        dataToSearchQueryPart = dataToSearchQueryPart.concat(`SELECT ? as info_dt, ? as import, ? as export, ? as cups_id`)

        pushToValues(infoDt,consumption,generation,cupsData)

        for (const energy of datadisCupsEnergyData) {
            
            let day = moment(energy.date,'YYYY/MM/DD').format('YYYY-MM-DD')
            let hour = moment(energy.time,'HH:mm').format('HH:mm:ss') 

            let datetime = `${day} ${hour}`;
            let energyImport = energy.consumptionKWh;
            let energyExport = energy.surplusEnergyKWh;

            pushToValues(datetime,energyImport,energyExport,cupsData)
            
            dataToSearchQueryPart = dataToSearchQueryPart.concat(` UNION ALL SELECT ?,?,?,? `)

        }

        let query = ` 
        INSERT INTO datadis_energy_registers (info_dt,import,export,cups_id) 
        SELECT info_dt, import, export, cups_id
        FROM ( ${dataToSearchQueryPart} ) AS data_to_check 
        WHERE data_to_check.info_dt
        NOT IN (
        SELECT info_dt
        FROM energy_registers
        WHERE info_dt
        BETWEEN ? AND ?  
        )
        AND cups_id = ?
        ` 

        values.push(startDateFormat); values.push(endDateFormat);values.push(cupsData.id);

        return new Promise(async (resolve,reject)=>{

            try{
                let [result] = await this.conn.execute<mysql.ResultSetHeader>(query, values);
                const insertedRows = result.affectedRows;
                resolve(insertedRows);
            }catch(e:any){
                console.log("error putting cups energy data", e);
                reject(e)
            }

        })

        function pushToValues(infoDt:string,consumption:number,generation:number,cupsData:any){
            values.push(infoDt); values.push(consumption); values.push(generation);values.push(cupsData.id)
        }

    }

    postLogs(cups:string,cupsId:number,operation:string,n_registers:number,startDate:any,endDate:any,getDatadisBegginningDate:any,getDatadisEndingDate:any,status:string,errorType:string,errorMessage:string){

        const log = {
            cups,
            n_registers,
            startDate,
            endDate,
            status:status,
            errorType,
            errorMessage,
            getDatadisBegginningDate,
            getDatadisEndingDate
        };

        const insertLogQuery = `INSERT INTO logs (log,cups,cups_id,status,operation,n_affected_registers,error_message) VALUES (?,?,?,?,?,?,?)`
        return new Promise(async (resolve,reject)=>{
            try{
                let [ROWS] = await this.conn.query(insertLogQuery, [JSON.stringify(log),cups,cupsId,status,operation,n_registers,errorMessage]);
                resolve(ROWS);
            } catch (e:any) {
                console.log("error inserting logs energy data", e);
                reject(e)
            }
        })
    }

}