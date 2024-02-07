import { Injectable } from "@nestjs/common";
import axios from 'axios';
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

/**
 * Service used t
 */
@Injectable()
export class DatadisService {


    loginData = {username:'g67684878',password:'acEM2020!'}
    token:any=undefined;
    supplies:supply[];
    startDate='2023/11'
    endDate='2024/02' //todo change
    energyHourData:energyHourData[]=[];

    constructor(){
        this.login().then(async()=>{
            await this.getSupplies();
            this.supplies.forEach(async (supply)=>{
                console.log(supply)
                let consumptionCupsData:any = await this.getConsumptionData(supply.cups,supply.distributorCode,this.startDate,this.endDate,0,supply.pointType).catch((e)=>{
                    return e;
                })
                this.energyHourData.push(consumptionCupsData) //todo: quitar 
            })
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
    async getConsumptionData(cups:string,distributorCode:number,startDate:string,endDate:string,meeasurementType:number,pointType:number){

        return new Promise(async (resolve,reject)=>{

            try {
                const baseUrl = 'https://datadis.es/api-private/api/get-consumption-data?'
    
                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${baseUrl}cups=${cups}&distributorCode=${distributorCode}&startDate=${startDate}&endDate=${endDate}&measurementType=${meeasurementType}&pointType=${pointType}`,
                    headers: { 
                        'Authorization': `Bearer ${this.token}`
                    }
                };
    
                let response = await axios.request(config);
                
                if (!response) {
                    console.log("Unknown error");
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

        

        

}