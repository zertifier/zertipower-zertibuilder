import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import moment from 'moment';
import { throwError } from "rxjs";
import { PasswordUtils } from "src/features/users/domain/Password/PasswordUtils";
import { LocationUtils } from "src/shared/domain/utils/locationUtils";


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
        
        let startDate= moment().subtract(1, 'weeks').format('YYYY/MM'); 
        let endDate= moment().format('YYYY/MM');
        //this.run(startDate,endDate)

        setInterval(()=>{
            startDate= moment().subtract(1, 'weeks').format('YYYY/MM'); 
            endDate= moment().format('YYYY/MM');
            //this.run(startDate,endDate)
        },86400000) //24 h => ms

    }

    async run(startDate:any,endDate:any){
        //get auth token
        this.login().then(async()=>{
            //get datadis cups
            await this.getSupplies();
            //check if all cups are in database already
            await this.checkCups();
            //go across cups:
            for (const supply of this.supplies){
                let cupsData:any = this.dbCups.find((registeredCups:any)=>registeredCups.cups===supply.cups)
                console.log("supply",supply)
                console.log("cupsData",cupsData)
                //obtain datadis hour energy:
                let datadisCupsEnergyData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,startDate,endDate,0,supply.pointType).catch((e)=>{
                    return e;
                })
                console.log(JSON.stringify(datadisCupsEnergyData).substring(0,200))
                //get cups energy hours db registers 
                let databaseEnergyHourData = await this.postCupsEnergyData(cupsData,datadisCupsEnergyData,startDate,endDate) //todo check!

                //insert readed cups energy hours 
                this.postLogs(supply.cups,datadisCupsEnergyData.length)

            }
        })
    }

    async login(){
        let config = {method:'post', url: 'https://datadis.es/nikola-auth/tokens/login', headers: { 'Content-Type': 'application/x-www-form-urlencoded'}, data:this.loginData}
        return new Promise(async (resolve,reject)=>{
            let response:any = await axios.request(config).catch((e:any)=>{
                console.log('error logging in', e)
                reject(e);
            });
            this.token = response.data;
            resolve(this.token);
        })
    }

    async getSupplies(){
        let config = {method:'get', maxBodyLength: Infinity, url: 'https://datadis.es/api-private/api/get-supplies', headers: { 'Authorization': `Bearer ${this.token}`}}
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

        return new Promise(async (resolve,reject)=>{

            try {
                const baseUrl = 'https://datadis.es/api-private/api/get-consumption-data?'
    
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${baseUrl}cups=${cups}&distributorCode=${distributorCode}&startDate=${startDate}&endDate=${endDate}&measurementType=${measurementType}&pointType=${pointType}`,
                    headers: { 
                        'Authorization': `Bearer ${this.token}`
                    }
                };
    
                let response = await axios.request(config);
                
                if (!response) {
                    console.log("Unknown error. Undefined response");
                    reject('Unknown error occurred');
                } else {
                    console.log(response);
                    resolve(response.data);
                }
            } catch (error) {
                console.error("Error:", error);
                reject(error); // Rechaza con el error capturado
            }
            
        })
    }

    async getCups():Promise<any>{
        return new Promise(async (resolve,reject)=>{
            try{
                const getCupsQuery = `SELECT * FROM cups`;
                let [ROWS]:any = await this.conn.query(getCupsQuery);
                this.dbCups = ROWS;
                resolve(this.dbCups);
            }catch(e){
                console.log("error getting cups", e);
                reject(e)
            }
        })
    }

    async checkCups():Promise<any>{
        return new Promise(async (resolve,reject)=>{
        try{
            const getCupsQuery = `SELECT * FROM cups`;
            const getLocationQuery = `SELECT * FROM locations WHERE province = ? AND municipality = ?`;
            const insertCupsQuery = `INSERT INTO cups (cups,location_id,address,datadis_user,datadis_password) VALUES (?,?,?,?,?)`;
            const insertCupsQueryLatLng = `INSERT INTO cups (cups,location_id,address,datadis_user,datadis_password, lat, lng) VALUES (?,?,?,?,?,?,?)`;
            const insertLocationQuery = `INSERT INTO locations (province,municipality) VALUES (?,?)`;
            let locationId;
            let coordinates:any = {};
            //insert cups if it isn't already registered
            this.supplies.map(async cupsData => {
                let dbFound = this.dbCups.find((registeredCups:any)=>registeredCups.cups===cupsData.cups)
                if(!dbFound){
                    console.log("try to insert new cups: ", cupsData);
                    const [ROWS]:any = await this.conn.query(getLocationQuery,[cupsData.province,cupsData.municipality])
                    if(ROWS[0]){
                        locationId = ROWS[0].id
                    } else {
                        //insert location if it isn't already registered
                        console.log("try to insert new location: ", cupsData.province,cupsData.municipality);
                        const [result]:any = await this.conn.query(insertLocationQuery,[cupsData.province,cupsData.municipality])
                        locationId = result.insertId;
                    }
                    let datadisEncriptedPassword = await PasswordUtils.encrypt(this.loginData.password)
                    //get cups geolocation
                     try {
                        let {lat,lng} = await LocationUtils.getCoordinates(cupsData.address,cupsData.municipality)
                        coordinates = {lat,lng}
                     } catch(e){
                        console.log("error getting geolocation", cupsData.address,cupsData.municipality, e)
                        //post cups without geolocation
                        await this.conn.query(insertCupsQuery,[cupsData.cups,locationId,cupsData.address,this.loginData.username,datadisEncriptedPassword]);    
                     }
                     //post cups with geolocation
                    await this.conn.query(insertCupsQueryLatLng,[cupsData.cups,locationId,cupsData.address,this.loginData.username,datadisEncriptedPassword,coordinates.lat,coordinates.lng]);
                }
            })
            let [allCups]:any = await this.conn.query(getCupsQuery);
            this.dbCups = allCups;
            resolve(allCups);
          } catch (e:any) {
            console.log("error getting energy areas", e);
            reject(e)
           
          }
        })
    }

    async postCupsEnergyData(cupsData:any,datadisCupsEnergyData:any[],startDate:string,endDate:string){

        //create get not inserted energy per cups query

        let dataToSearchQueryPart = ''
        let values:any = []
        let firstEnergyDate = datadisCupsEnergyData[0]
        datadisCupsEnergyData.slice(1)
        
        let day = moment(firstEnergyDate.date ).format('DD-MM-YYYY')
        let hour = moment(firstEnergyDate.time).format('HH:mm:ss') 
        let datetime = `${day} ${hour}`;
        let consumption = firstEnergyDate.consumptionKWh;
        let generation = firstEnergyDate.surplusEnergyKWh;

        dataToSearchQueryPart.concat(`SELECT ? as info_datetime, ? as consumption, ? as production, ? as cups_id`)

        pushToValues(datetime,consumption,generation,cupsData)

        datadisCupsEnergyData.forEach((energy,index) => {
            
            let day = moment(energy.date ).format('DD-MM-YYYY')
            let hour = moment(energy.time).format('HH:mm:ss') 

            let datetime = `${day} ${hour}`;
            let consumption = energy.consumptionKWh;
            let generation = energy.surplusEnergyKWh;

            pushToValues(datetime,consumption,generation,cupsData)
            
            dataToSearchQueryPart.concat(`UNION ALL SELECT ?,?,?`)

        })

        let query = ` 
        INSERT INTO energy_registers (info_dt, generation, consumption,cups_id) 
        SELECT info_datetime, generation, consumption, cups_id
        FROM ( ${dataToSearchQueryPart} ) AS data_to_check 
        WHERE data_to_check.info_datetime
        NOT IN (
        SELECT info_datetime
        FROM energy_registers
        WHERE info_datetime 
        BETWEEN ? AND ?  
        )
        AND cups_id = ?
        ` 

        values.push(startDate); values.push(endDate);values.push(cupsData.id);

        return new Promise(async (resolve,reject)=>{

            try{
                let [ROWS] = await this.conn.query(query, values);
                resolve(ROWS);
            }catch(e:any){
                console.log("error putting cups energy data", e);
                reject(e)
            }

        })

        function pushToValues(datetime:string,consumption:number,generation:number,cupsData:any){
            values.push(datetime); values.push(consumption); values.push(generation);values.push(cupsData.id)
        }

    }

    postLogs(cups:string, n_registers:number){
        const insertLogsQuery = `INSERT INTO energy_registers_logs (cups,n_registers) VALUES (?,?)`
        return new Promise(async (resolve,reject)=>{
            try{
                let [ROWS] = await this.conn.query(insertLogsQuery, [cups, n_registers]);
                resolve(ROWS);
            } catch (e:any) {
                console.log("error setting logs energy data", e);
                reject(e)
            }
        })
    }

}