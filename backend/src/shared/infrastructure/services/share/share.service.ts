import {Injectable} from '@nestjs/common';
import mysql from "mysql2/promise";
import {MysqlService} from "../mysql-service";
import * as moment from "moment";
import {EnvironmentService} from "../environment-service";


export interface RedistributeObject {
  totalSurplus: number,
  resultTotalSurplus: number,
  surplusCups: number,
  surplusEhId: number,
  redisitributePartners: RedistributePartner[]
}

export interface RedistributePartner {
  consumption: number,
  resultConsumption: number,
  cupsId: number,
  ehId: number,
  infoDt: Date
}

export interface RegistersFromDb {
  eh_id: number,
  kwh_in: number,
  kwh_out: number,
  info_dt: Date,
  type: 'consumer' | 'community',
  cups_id: number,
  community_id: number,
}

@Injectable()
export class ShareService {
  redistributeObject: RedistributeObject = {
    totalSurplus: 100,
    resultTotalSurplus: 0,
    surplusCups: 20,
    surplusEhId: 0,
    redisitributePartners: [
      {consumption: 30, resultConsumption: 0, cupsId: 1, infoDt: new Date, ehId: 1},
      {consumption: 40, resultConsumption: 0, cupsId: 2, infoDt: new Date, ehId: 2},
      {consumption: 10, resultConsumption: 0, cupsId: 3, infoDt: new Date, ehId: 3},
    ]
  };
  private conn: mysql.Pool;

  constructor(private mysql: MysqlService, private environment: EnvironmentService) {
    this.conn = this.mysql.pool;
    this.redistribute()

    setInterval(() => {
      this.redistribute()
    }, this.environment.getEnv().TRADE_UPDATE_DAYS * 24 * 60 * 60)
  }

  async redistribute() {
    console.log("Starting trades update...")

    const surplusRegisters = await this.getNewSurplusRegisters()
    const newRegisters = await this.getNewRegisters()

    console.log(`Updating ${surplusRegisters.length} registers...`)
    for (const surplusRegister of surplusRegisters) {
      const redisitributePartners = this.getRegistersByDateAndCommunity(surplusRegister.info_dt, surplusRegister.community_id, newRegisters)
      const redistributeObject = {
        totalSurplus: parseFloat(surplusRegister.kwh_out.toString()),
        resultTotalSurplus: 0,
        surplusCups: surplusRegister.cups_id,
        surplusEhId: surplusRegister.eh_id,
        redisitributePartners
      }
      // console.log(redistributeObject, "SURPLUS")

      const calculatedRedistribute = this.calculateRedistribution(redistributeObject)

      await this.insertToTrades(calculatedRedistribute)
    }

    console.log("Finished trades update")
  }

  calculateRedistribution(redistributeObject: RedistributeObject = this.redistributeObject) {
    let total = redistributeObject.totalSurplus;
    let partners = redistributeObject.redisitributePartners;
    let activePartners = partners.length;

    // console.log(redistributeObject)
    partners.forEach(partner => {
      partner.resultConsumption = partner.consumption;
    });

    // Redistribute while it has energy and active partners with consumption
    while (total > 0 && activePartners > 0) {
      // let subtractor = total / activePartners; // Treure decimals y posarlos a total
      let subtractor = Math.floor(total * 1000 / activePartners) / 1000;
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

      // If energy is not distributed we exit the loop
      if (distributed === 0) break;

      total -= distributed;

      // Si el total es mes petit que el numero de consumidors has de repartir aleatoriament el total a un consumidor i fer un break.
      if (total < activePartners) {
        const partnersWithConsumption = partners.filter((partner) => partner.resultConsumption > 0)

        if (partnersWithConsumption.length) {
          let index = 0
          if (partnersWithConsumption.length > 1)
            index = this.getRandomInt(0, partnersWithConsumption.length - 1)

          partnersWithConsumption[index].resultConsumption -= total
        }

        total = 0
      }
    }

    redistributeObject.resultTotalSurplus = total

    return redistributeObject
  }

  getRegistersByDateAndCommunity(surplusRegisterDate: Date, communityId: number, newRegisters: RegistersFromDb[]) {
    const date = moment(surplusRegisterDate).format('YYYY-MM-DD HH')
    const filteredRegisters = newRegisters.filter((register) =>
      moment(register.info_dt).format('YYYY-MM-DD HH') == date && communityId == register.community_id
    )

    return filteredRegisters.map(this.formatPartnerObjects)

  }

  getNewSurplusRegisters(): Promise<RegistersFromDb[]> {
    return new Promise(async (resolve) => {
      console.log(`
        SELECT e.id eh_id, e.kwh_in, e.kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
        WHERE t.info_dt IS NULL
          AND kwh_out > 0
          AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_out DESC;
      `)
      let query = `
        SELECT e.id eh_id, e.kwh_in, e.kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
        WHERE t.info_dt IS NULL
          AND kwh_out > 0
          AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_out DESC;
      `

      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }

  getNewRegisters(): Promise<RegistersFromDb[]> {
    return new Promise(async resolve => {
      let query = `
        SELECT e.id eh_id, e.kwh_in, e.kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
        WHERE t.info_dt IS NULL
          AND kwh_in > 0
          AND cups.type != 'community'
        ORDER BY e.info_dt DESC, kwh_in DESC;
      `
      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }

  async insertToTrades(trade: RedistributeObject) {
    let query = 'INSERT INTO trades (energy_hourly_from_id, energy_hourly_to_id, from_cups_id, to_cups_id, action, traded_kwh, cost, previous_kwh, current_kwh, info_dt) VALUES ';
    let resultSellTotalKwh = trade.totalSurplus

    for (const partner of trade.redisitributePartners) {
      const tradedKwh = partner.consumption - partner.resultConsumption
      const infoDt = moment(partner.infoDt).format('YYYY-MM-DD HH:mm:ss')
      const totalSellSurplus = resultSellTotalKwh
      resultSellTotalKwh -= tradedKwh

      //BUY
      query +=
        `(${partner.ehId}, ${trade.surplusEhId}, ${partner.cupsId}, ${trade.surplusCups}, 'BUY', ${tradedKwh}, ${0}, ${partner.consumption}, ${partner.resultConsumption}, "${infoDt}"),`
      //SELL
      query +=
        `(${trade.surplusEhId}, ${partner.ehId}, ${trade.surplusCups}, ${partner.cupsId}, 'SELL', ${tradedKwh}, ${0}, ${totalSellSurplus}, ${resultSellTotalKwh}, "${infoDt}"),`
    }

    query = query.slice(0, -1);

    if (trade.redisitributePartners.length) {
      let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
      // const insertedRows = result.affectedRows;
      console.log(`Inserted values on trades from date: ${trade.redisitributePartners[0].infoDt}`);
    }
  }

  formatPartnerObjects(data: RegistersFromDb) {
    let partner: RedistributePartner = {
      consumption: 0,
      cupsId: 0,
      ehId: 0,
      resultConsumption: 0,
      infoDt: new Date
    }
    partner.consumption = parseFloat(data.kwh_in.toString())
    partner.infoDt = data.info_dt
    partner.cupsId = data.cups_id
    partner.ehId = data.eh_id

    return partner
  }

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
