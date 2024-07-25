import { Injectable } from '@nestjs/common';
import mysql from "mysql2/promise";
import { MysqlService } from "../mysql-service";
import * as moment from "moment";
import { EnvironmentService } from "../environment-service";
import { NotificationsService, notificationCodes } from '../notifications-service';


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
  infoDt: Date,
  userId: number,
  tradeCost?: number,
  tradedKWh?: number,
  sellerName?: string,
  buyerName?: string
}

export interface RegistersFromDb {
  eh_id: number,
  kwh_in: number,
  kwh_out: number,
  info_dt: Date,
  type: 'consumer' | 'community',
  cups_id: number,
  community_id: number,
  user_id: number
}

@Injectable()
export class ShareService {
  redistributeObject: RedistributeObject = {
    totalSurplus: 100,
    resultTotalSurplus: 0,
    surplusCups: 20,
    surplusEhId: 0,
    redisitributePartners: [
      { consumption: 30, resultConsumption: 0, cupsId: 1, infoDt: new Date, ehId: 1, userId: 1 },
      { consumption: 40, resultConsumption: 0, cupsId: 2, infoDt: new Date, ehId: 2, userId: 1 },
      { consumption: 10, resultConsumption: 0, cupsId: 3, infoDt: new Date, ehId: 3, userId: 1 },
    ]
  };
  private conn: mysql.Pool;

  constructor(private mysql: MysqlService, private environment: EnvironmentService, private notificationService: NotificationsService) {
    this.conn = this.mysql.pool;
    try {
      this.redistribute()
    } catch (error) {
      console.log("shares redistribution error", error)
    }


    setInterval(() => {
      try {
        this.redistribute()
      } catch (error) {
        console.log("shares redistribution error", error)
      }
    }, this.environment.getEnv().TRADE_UPDATE_DAYS * 24 * 60 * 60)
  }

  async redistribute() {
    console.log("Starting trades update...")

    const surplusRegisters = await this.getNewSurplusRegisters()
    const newRegisters = await this.getNewRegisters()

    console.log(`Updating ${surplusRegisters.length} registers...`)

    for (const surplusRegister of surplusRegisters) {
      const communityPrice = await this.getCommunityPrice(surplusRegister.community_id)
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

      await this.insertToTrades(calculatedRedistribute, communityPrice)
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

    return new Promise(async (resolve, reject) => {
      try {
        /*let query = `
          SELECT e.id eh_id, e.kwh_in, e.kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id
          FROM energy_hourly e
                 LEFT JOIN trades t ON e.info_dt = t.info_dt
                 LEFT JOIN cups ON e.cups_id = cups.id
                 LEFT JOIN users ON cups.customer_id = users.customer_id
          WHERE t.info_dt IS NULL
            AND kwh_out > 0
            AND cups.type != 'community'
          ORDER BY e.info_dt DESC, kwh_out DESC;
        `*/
        let query = `
        SELECT e.id eh_id, e.kwh_in, (e.kwh_out - e.kwh_in) kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id, users.id user_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
        WHERE t.info_dt IS NULL
          AND cups.type != 'community'
        HAVING kwh_out > 0
        ORDER BY e.info_dt DESC, kwh_out DESC;
      `
        let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
        resolve(result);

      } catch (error) {
        reject(error)
      }
    })

  }

  getNewRegisters(): Promise<RegistersFromDb[]> {
    return new Promise(async resolve => {
      let query = `
        SELECT e.id eh_id, (e.kwh_in - e.kwh_out) kwh_in,e.kwh_out, e.info_dt, cups.id cups_id, cups.community_id community_id, users.email email, users.id user_id
        FROM energy_hourly e
               LEFT JOIN trades t ON e.info_dt = t.info_dt
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
        WHERE t.info_dt IS NULL
          AND cups.type != 'community'
        HAVING kwh_in > 0
        ORDER BY e.info_dt DESC, kwh_in DESC;
      `
      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      resolve(result);
    })
  }

  async customerHasSufficientBalance(tradePrice: any, balance: any) {
    if (balance >= tradePrice) {
      return true;
    } else {
      return false;
    }
  }

  async getCustomerFromCupsId(cupsId: number) {
    let query = `SELECT customers.* FROM customers
    LEFT JOIN cups ON cups.customer_id = customers.id
    WHERE cups.id = ?`
    let [ROWS]: any = await this.conn.execute(query, [cupsId]);
    if (ROWS[0]) {
      return ROWS[0];
    } else {
      throw new Error(`Error getting customer balance. Customer with cups id ${cupsId} not found.`);
    }
  }

  async updateCustomerBalance(customerId: number, balance: number) {
    let query = `UPDATE customers set balance = ? WHERE id = ?`
    try {
      let [ROWS]: any = await this.conn.execute(query, [balance, customerId]);
    } catch (error) {
      console.log('error updating customer balance: ', error)
      throw new Error(`Error updating customer balance ${customerId}: ${error}`);
    }
  }

  async getCommunityPrice(communityId: number) {
    let query = `SELECT energy_price FROM communities WHERE id = ?`
    let [ROWS]: any = await this.conn.execute(query, [communityId]);
    if (ROWS[0] && ROWS[0].energy_price) {
      return ROWS[0].energy_price;
    } else {
      throw new Error(`error getting community price ${communityId}`);
    }
  }

  async insertToTrades(trade: RedistributeObject, communityPrice: number) {

    let query = 'INSERT INTO trades (energy_hourly_from_id, energy_hourly_to_id, from_cups_id, to_cups_id, action, traded_kwh, cost, previous_kwh, current_kwh, info_dt) VALUES ';
    let updateCustomersBalanceQuery = 'UPDATE customers SET balance = CASE id'
    let resultSellTotalKwh = trade.totalSurplus
    let cupsBalancesToUpdate: any = {};
    let transactionNumber = 0;

    for (const partner of trade.redisitributePartners) {

      const tradedKwh = parseFloat((partner.consumption - partner.resultConsumption).toFixed(3))
      const tradeCost = parseFloat((tradedKwh * communityPrice).toFixed(3));
      partner.tradeCost = tradeCost;
      partner.tradedKWh = tradedKwh;

      const infoDt = moment(partner.infoDt).format('YYYY-MM-DD HH:mm:ss')
      const totalSellSurplus = resultSellTotalKwh
      resultSellTotalKwh -= tradedKwh

      const customerBuyer = await this.getCustomerFromCupsId(partner.cupsId);
      const customerSeller = await this.getCustomerFromCupsId(trade.surplusCups);

      partner.buyerName = customerBuyer.name;
      partner.sellerName = customerSeller.name;

      const isSuficientBalance = await this.customerHasSufficientBalance(tradeCost, customerBuyer.balance);

      if (isSuficientBalance && tradeCost > 0.001) {

        transactionNumber++;

        const buyerBalance = parseFloat(customerBuyer.balance);
        const sellerBalance = parseFloat(customerSeller.balance);

        const newBuyerBalance = buyerBalance - tradeCost;
        const newSellerBalance = sellerBalance + tradeCost;

        cupsBalancesToUpdate[customerBuyer.id] = newBuyerBalance;
        cupsBalancesToUpdate[customerSeller.id] = newSellerBalance;

        //BUY
        query +=
          `(${partner.ehId}, ${trade.surplusEhId}, ${partner.cupsId}, ${trade.surplusCups}, 'BUY', ${tradedKwh}, ${tradeCost}, ${partner.consumption}, ${partner.resultConsumption}, "${infoDt}"),`
        //SELL
        query +=
          `(${trade.surplusEhId}, ${partner.ehId}, ${trade.surplusCups}, ${partner.cupsId}, 'SELL', ${tradedKwh}, ${tradeCost}, ${totalSellSurplus}, ${resultSellTotalKwh}, "${infoDt}"),`

        //console.log("SUFFICIENT! ", `Customer ${customerBuyer.name} with cups id ${partner.cupsId} has sufficient balance ${customerBuyer.balance} for the trade cost ${tradeCost}`)
        //console.log("Buyer",customerBuyer,partner.cupsId)
        //console.log("Seller",customerSeller,trade.surplusCups)

      } else {
        //console.log(`customer ${customerBuyer.name} with cups id ${partner.cupsId} has insufficient balance ${customerBuyer.balance} for the trade cost ${tradeCost} / Trade cost is 0 `)
      }

    }

    query = query.slice(0, -1);

    if (transactionNumber > 0) { //if (trade.redisitributePartners.length) {

      try{
        let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
      } catch(error){
        console.log("error creating trades",error);
        return;
      }
      
      // const insertedRows = result.affectedRows;
      console.log(`Inserted values on trades from date: ${trade.redisitributePartners[0].infoDt}`);

      try {

        for (const partner of trade.redisitributePartners) {
          const sharedKW = partner.tradedKWh!.toString();
          const tradeCost = partner.tradeCost!.toString();
          const infoDt = moment(partner.infoDt).format('DD-MM-YYYY HH:mm:ss');
          const buyerName = partner.buyerName || '(UNNAMED)'
          const sellerName = partner.sellerName || '(UNNAMED)'

          //notificar al from del sell y al to del buy
          const subjectSell = this.notificationService.getNotificationSubject(notificationCodes.sharingSent, this.notificationService.defaultNotificationLang, { sharedKW, tradeCost, customerName:buyerName, infoDt });
          let messageSell = `Shared to ${buyerName}` //l'energia s'ha venut a x
          const subjectBuy = this.notificationService.getNotificationSubject(notificationCodes.sharingReceived, this.notificationService.defaultNotificationLang, { sharedKW, tradeCost,customerName:sellerName, infoDt });
          let messageBuy = `Shared from ${sellerName}` //l'energia s'ha comprat a x
          //TODO surplus cups
          this.notificationService.sendNotification(partner.userId, notificationCodes.sharingSent, subjectSell, messageSell)
          this.notificationService.sendNotification(partner.userId, notificationCodes.sharingReceived, subjectBuy, messageBuy)
        }

      } catch (error) {
        console.log(error)
        return;
      }

      try {

        // Complete the update customers balances query
        const uniqueCupsBalancesToUpdate = Object.keys(cupsBalancesToUpdate);

        if (uniqueCupsBalancesToUpdate.length > 0) {

          uniqueCupsBalancesToUpdate.forEach(id => {
            updateCustomersBalanceQuery += ` WHEN ${id} THEN ${cupsBalancesToUpdate[id]} `;
          });
          updateCustomersBalanceQuery += ` ELSE balance END WHERE id IN (${uniqueCupsBalancesToUpdate.join(', ')});`;

          let [ROWS] = await this.conn.execute(updateCustomersBalanceQuery)

        }

      } catch (error) {
        console.log("Error updating consumer balances", error);
      }

    }

  }

  formatPartnerObjects(data: RegistersFromDb) {
    let partner: RedistributePartner = {
      consumption: 0,
      cupsId: 0,
      ehId: 0,
      resultConsumption: 0,
      infoDt: new Date,
      userId: 0
    }
    partner.consumption = parseFloat(data.kwh_in.toString())
    partner.infoDt = data.info_dt
    partner.cupsId = data.cups_id
    partner.ehId = data.eh_id
    partner.userId = data.user_id

    return partner
  }

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
