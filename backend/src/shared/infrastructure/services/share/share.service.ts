import { Injectable } from '@nestjs/common';
import mysql from "mysql2/promise";
import {MysqlService} from "../mysql-service";


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

  }
  redistribute(redistributeObject: RedistributeObject = this.redistributeObject){
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
    console.log(this.redistributeObject)
    this.getNewRegisters().then((res) => {
      console.log(res, "RES")
    })
    return this.redistributeObject
  }

  getNewRegisters(){
    console.log("aaaaaaaaaaaaaaaa")
    return new Promise(async resolve => {
      let query = `
        SELECT e.id, e.kwh_in, e.kwh_out, e.production, e.info_dt, cups.type, cups.surplus_distribution, cups.community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
        WHERE t.info_dt IS NULL AND kwh_out > 0 AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_out DESC LIMIT 10;
      `
      console.log(query)
      let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }
}
