import { Injectable } from "@nestjs/common";
import axios from 'axios';
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import moment from 'moment';


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
    startDate= ''//moment().subtract(1, 'weeks').format('YYYY/MM'); 
    endDate= ''//moment().format('YYYY/MM');

    energyHourData:energyHourData[]=[];
    private conn: mysql.Pool;

    constructor(private mysql: MysqlService){

        this.conn = this.mysql.pool;

        /*
         this.login().then(async()=>{
             await this.getSupplies();
             await this.checkCups();
             for (const supply of this.supplies){
                 console.log(supply)
                 let consumptionCupsData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,this.startDate,this.endDate,0,supply.pointType).catch((e)=>{
                     return e;
                 })
                 this.energyHourData = this.energyHourData.concat(consumptionCupsData) 
                 await getCupsEnergyData(cupsId,startDate,endDate) //todo check!

             }
             for (const energy of this.energyHourData){
                 //todo get cups id from cups
                 //todo check if hour is registered
                 //todo post if it isn't registered
             }
             this.energyHourData=[];
         })
*/
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
            this.supplies.map(async cupsData=>{
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

    getCupsEnergyData(cupsId:number,startDate:string,endDate:string){
        return new Promise(async (resolve,reject)=>{
            try{
                //todo: table is energy_registers_original_hourly (change database)
                const getCupsEnergyDataQuery = `SELECT * FROM energy_registers_original_hourly where cups_id = ? and info_datetime IS BEETWEEN ? AND ?`;
                let [ROWS] = await this.conn.query(getCupsEnergyDataQuery, [cupsId, startDate, endDate]);
                resolve(ROWS);
                } catch (e:any) {
                console.log("error getting cups energy data", e);
                reject(e)
                }
            })
    }

        

}