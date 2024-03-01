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
    community_id: number,
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
            //this.run(startDate,endDate)
        },86400000) //24 h => ms

    }

    async run(startDate:any,endDate:any){

        let error = false;
        let errorType = '';
        let errorMessage = '';
        let operation = '';

        this.dbCups = await this.getCups()

        for (let cups of this.dbCups) {

            if(!cups.datadis_active || !cups.datadis_user || !cups.datadis_password){
                continue;
            }

            this.loginData.username=cups.datadis_user;
            this.loginData.password= PasswordUtils.decryptData(cups.datadis_password,process.env.JWT_SECRET!);

            //get auth token
            await this.login();

            //get datadis cups
            await this.getSupplies();

            //check if all cups are in database already
            await this.checkCups();

            //go across cups:
            for (const supply of this.supplies){

                error = false;
                errorType = '';
                errorMessage = '';
                operation = ''

                let cupsData:any = this.dbCups.find((registeredCups:any)=>registeredCups.cups===supply.cups)
                
                if(!cupsData){
                    console.log("Error cups data not found on db : " , supply.cups)
                    error = true;
                    errorType = 'Error cups data not found on db';
                    operation = 'Find cups data register by datadis supply.cups'
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,null,null,error,errorType,errorMessage)
                    continue;
                }

                let getDatadisBegginningDate = moment().format("DD-MM-YYYY HH:mm:ss");

                //obtain datadis hour energy:
                let datadisCupsEnergyData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,startDate,endDate,0,supply.pointType).catch(async (e)=>{
                    let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");
                    error=true;
                    errorType="datadis request error";
                    errorMessage=e.toString().substring(0,200)
                    operation="get datadis hourly energy registers"
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,getDatadisBegginningDate,getDatadisEndingDate,error,errorType,errorMessage)
                    return null;
                })

                if(!datadisCupsEnergyData){
                    console.log("no datadisCupsEnergyData ",datadisCupsEnergyData, ". Continue")
                    error = true;
                    errorType = 'no datadis cups energy data';
                    operation = 'Get energy data from datadis (https://datadis.es/api-private/api/get-consumption-data)'
                    await this.postLogs(supply.cups,cupsData.id,operation,0,startDate,endDate,null,null,error,errorType,errorMessage)
                    continue;
                }

                let getDatadisEndingDate = moment().format("DD-MM-YYYY HH:mm:ss");

                //get cups energy hours db registers 
                let databaseEnergyHourData = await this.postCupsEnergyData(cupsData,datadisCupsEnergyData,startDate,endDate).catch(e=>{
                    error=true;
                    errorType="post datadis data error";
                    errorMessage=e.toString().substring(0,200);
                    operation="post datadis hourly energy registers data into database";
                });

                //insert readed cups energy hours 
                await this.postLogs(supply.cups,cupsData.id,operation,datadisCupsEnergyData.length,startDate,endDate,getDatadisBegginningDate,getDatadisEndingDate,error,errorType,errorMessage)

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
        return new Promise(async (resolve,reject)=>{
            let response:any = await axios.request(config).catch((e:any)=>{
                console.log('error logging in', e)
                reject(e);
            });
            this.supplies=response.data;
            resolve(this.supplies);
        })
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
    async getConsumptionData(cups:string,distributorCode:number,startDate:string,endDate:string,measurementType:number,pointType:number){

        console.log("try to get datadis data: ",cups,distributorCode,startDate,endDate,0,pointType)

        return new Promise(async (resolve,reject)=>{

            try {
                const baseUrl = 'https://datadis.es/api-private/api/get-consumption-data?'
    
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

    async postCupsEnergyData(cupsData:any,datadisCupsEnergyData:any[],startDate:string,endDate:string){

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

        dataToSearchQueryPart = dataToSearchQueryPart.concat(`SELECT ? as info_dt, ? as import, ? as generation, ? as cups_id`)

        pushToValues(infoDt,consumption,generation,cupsData)

        for (const energy of datadisCupsEnergyData) {
            
            let day = moment(energy.date).format('YYYY-MM-DD')
            let hour = moment(energy.time,'HH:mm').format('HH:mm:ss') 

            let datetime = `${day} ${hour}`;
            let consumption = energy.consumptionKWh;
            let generation = energy.surplusEnergyKWh;

            pushToValues(datetime,consumption,generation,cupsData)
            
            dataToSearchQueryPart = dataToSearchQueryPart.concat(` UNION ALL SELECT ?,?,?,? `)

        }

        let query = ` 
        INSERT INTO energy_registers (info_dt, import,generation,cups_id) 
        SELECT info_dt, import, generation, cups_id
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
                let [ROWS] = await this.conn.query(query, values);
                resolve(ROWS);
            }catch(e:any){
                console.log("error putting cups energy data", e);
                reject(e)
            }

        })

        function pushToValues(infoDt:string,consumption:number,generation:number,cupsData:any){
            values.push(infoDt); values.push(consumption); values.push(generation);values.push(cupsData.id)
        }

    }

    postLogs(cups:string,cupsId:number,operation:string,n_registers:number,startDate:any,endDate:any,getDatadisBegginningDate:any,getDatadisEndingDate:any,error:boolean,errorType:string,errorMessage:string){

        const log = {
            cups,
            n_registers,
            startDate,
            endDate,
            error,
            errorType,
            errorMessage,
            getDatadisBegginningDate,
            getDatadisEndingDate
        };

        const insertLogQuery = `INSERT INTO logs (log,cups,cups_id,error,operation,n_affected_registers,error_message) VALUES (?,?,?,?,?,?,?)`
        return new Promise(async (resolve,reject)=>{
            try{
                let [ROWS] = await this.conn.query(insertLogQuery, [JSON.stringify(log),cups,cupsId,error,operation,n_registers,errorMessage]);
                resolve(ROWS);
            } catch (e:any) {
                console.log("error inserting logs energy data", e);
                reject(e)
            }
        })
    }

}