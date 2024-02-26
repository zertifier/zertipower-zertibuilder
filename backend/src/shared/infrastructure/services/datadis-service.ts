import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import moment from 'moment';
import { throwError } from "rxjs";


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


/**
 * Service used t
 */
@Injectable()
export class DatadisService {


    loginData = {username:'g67684878',password:'acEM2020!'}
    token:any=undefined;
    supplies:supply[];

    //see data from a week ago
    

    energyHourData:energyHourData[]=[];
    private conn: mysql.Pool;

    constructor(private mysql: MysqlService){

        this.conn = this.mysql.pool; 
        
        let startDate= moment().subtract(1, 'weeks').format('YYYY/MM'); 
        let endDate= moment().format('YYYY/MM');
        this.run

        setInterval(()=>{
            startDate= moment().subtract(1, 'weeks').format('YYYY/MM'); 
            endDate= moment().format('YYYY/MM');
            this.run
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
                
                console.log(supply)

                //obtain datadis hour energy:
                let datadisCupsEnergyData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,startDate,endDate,0,supply.pointType).catch((e)=>{
                    return e;
                })

                console.log(JSON.stringify(datadisCupsEnergyData).substring(0,200))

                //insert readed cups energy hours 
                this.postLogs(supply.cups,datadisCupsEnergyData.length)
             
                //get cups energy hours db registers 
                let databaseEnergyHourData = await this.postCupsEnergyData(supply.cups,datadisCupsEnergyData,startDate,endDate) //todo check!

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

    async checkCups(){
        return new Promise(async (resolve,reject)=>{
        try{
            const getCupsQuery = `SELECT * FROM cups`;
            const insertCupsQuery = `INSERT INTO cups (cups,ubication) VALUES (?,?)`

            let [ROWS] = await this.conn.query(getCupsQuery);
            let dbCups:any = ROWS;

            //insert cups if it isn't already registered
            this.supplies.map(async cupsData => {
                let dbFound = dbCups.find((registeredCups:any)=>registeredCups.cups===cupsData.cups)
                if(!dbFound){
                    //todo: add address, province, municipality at db cups table
                    await this.conn.query(insertCupsQuery,[cupsData.cups,cupsData.municipality]);
                }
            })

            let [allCups] = await this.conn.query(getCupsQuery);
            dbCups = allCups;
            resolve(dbCups);
            
          } catch (e:any) {
            console.log("error getting energy areas", e);
            reject(e)
           
          }
        })
    }

    async postCupsEnergyData(cups:string,datadisCupsEnergyData:any[],startDate:string,endDate:string){

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

        //get cups id
        let cupsId:any;
        try{
            let getCupsIdQuery  =`SELECT id FROM cups WHERE cups = ?`;
            let [ROWS]:any = await this.conn.query(getCupsIdQuery, [cups]);
            cupsId = ROWS[0].id;
        } catch (e:any) {
            console.log("error getting cups energy data", e);
            throwError(e)
        }

        dataToSearchQueryPart.concat(`SELECT ? as info_datetime, ? as consumption, ? as production, ? as cups_id`)

        values.push(datetime); values.push(consumption); values.push(generation);values.push(cupsId)

        datadisCupsEnergyData.forEach((energy,index) => {
            
            let day = moment(energy.date ).format('DD-MM-YYYY')
            let hour = moment(energy.time).format('HH:mm:ss') 

            let datetime = `${day} ${hour}`;
            let consumption = energy.consumptionKWh;
            let generation = energy.surplusEnergyKWh;

            values.push(datetime);
            values.push(consumption);
            values.push(generation)
            values.push(cupsId);
            
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

        values.push(startDate); values.push(endDate);values.push(cupsId);

        return new Promise(async (resolve,reject)=>{

            /*try{
                //todo: table is energy_registers_original_hourly (change database)
                const getCupsEnergyDataQuery = `SELECT energy_registers_original_hourly.*, cups FROM energy_registers_original_hourly LEFT join cups ON cups.id = cups_id where cups = ? and info_datetime IS BEETWEEN ? AND ?`;
                let [ROWS] = await this.conn.query(getCupsEnergyDataQuery, [cups, startDate, endDate]);
                resolve(ROWS);
            } catch (e:any) {
                console.log("error getting cups energy data", e);
                reject(e)
            }*/

            try{
                let [ROWS] = await this.conn.query(query, values);
                resolve(ROWS);
            }catch(e:any){
                console.log("error putting cups energy data", e);
                reject(e)
            }

        })

    }

    postLogs(cups:string, n_registers:number){
        const insertLogsQuery = `INSERT INTO logs (cups,n_registers) VALUES (?,?)`
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