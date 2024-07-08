import { Injectable } from '@nestjs/common';
import mysql from "mysql2/promise";
import {MysqlService} from "../mysql-service";
import * as moment from "moment";


export interface RedistributeObject {
  totalSurplus: number,
  resultTotalSurplus: number,
  redisitributePartners: RedistributePartner[]
}

export interface RedistributePartner{
  consumption: number,
  resultConsumption: number
  wallet: string,
}

export interface RegistersFromDb{
  id: number,
  kwh_in: number,
  kwh_out: number,
  info_dt: Date,
  type: 'consumer' | 'community',
  community_id: number
}
@Injectable()
export class ShareService {
  redistributeObject: RedistributeObject = {
    totalSurplus: 100,
    resultTotalSurplus: 0,
    redisitributePartners: [
      { consumption: 30, resultConsumption: 0, wallet: "0xAA" },
      { consumption: 40, resultConsumption: 0, wallet: "0xBB" },
      { consumption: 10, resultConsumption: 0, wallet: "0xCC" },
    ]
  };
  private conn: mysql.Pool;
  constructor(private mysql: MysqlService) {
    this.conn = this.mysql.pool;
    this.redistribute()

  }
  async redistribute(){
    const surplusRegisters = await this.getNewSurplusRegisters()
    const newRegisters = await this.getNewRegisters()

    for (const surplusRegister of surplusRegisters) {
      this.getRegistersByDate(surplusRegister.info_dt, newRegisters)
    }
    return this.redistributeObject
  }

  calculateRedistribution(redistributeObject: RedistributeObject = this.redistributeObject){
    let total = redistributeObject.totalSurplus;
    let partners = redistributeObject.redisitributePartners;
    let activePartners = partners.length;

    partners.forEach(partner => {
      partner.resultConsumption = partner.consumption;
    });

    // Redistribute while it has energy and active partners with consumption
    while (total > 0 && activePartners > 0) {
      let subtractor = total / activePartners;
      let distributed = 0;

      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i];

        if (partner.resultConsumption > 0) {
          let result = partner.resultConsumption - subtractor;

          if (result < 0) {
            // If consumption == 0, readjust energy left
            distributed += partner.resultConsumption;
            partner.resultConsumption = 0;
            activePartners--;
          } else {
            // Subtract partner consumption
            distributed += subtractor;
            partner.resultConsumption = result;
          }
        }
      }

      total -= distributed;
    }

    redistributeObject.resultTotalSurplus = total

  }
  getRegistersByDate(surplusRegisterDate: Date, newRegisters: RegistersFromDb[]){
    console.log(surplusRegisterDate, "surplusRegisterDate")
    const date = moment(surplusRegisterDate).format('YYYY-MM-DD HH')
    const filteredRegisters =newRegisters.filter((register) => moment(register.info_dt).format('YYYY-MM-DD HH') == date)

    console.log(date)
    console.log(filteredRegisters)
    console.log('---------------------')

  }

  getNewSurplusRegisters(): Promise<RegistersFromDb[]>{
    return new Promise(async (resolve) => {
      let query = `
        SELECT e.id, e.kwh_in, e.kwh_out, e.info_dt, cups.community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
        WHERE t.info_dt IS NULL AND kwh_out > 0 AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_out DESC LIMIT 10;
      `
      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }

  getNewRegisters(): Promise<RegistersFromDb[]>{
    return new Promise(async resolve => {
      let query = `
        SELECT e.id, e.kwh_in, e.kwh_out, e.info_dt, cups.community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
        WHERE t.info_dt IS NULL AND kwh_in > 0 AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_in DESC;
      `
      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }
}
