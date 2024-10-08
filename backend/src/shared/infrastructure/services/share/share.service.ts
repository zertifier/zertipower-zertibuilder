import {Injectable} from '@nestjs/common';
import mysql from "mysql2/promise";
import {MysqlService} from "../mysql-service";
import * as moment from "moment";
import {EnvironmentService} from "../environment-service";
import {NotificationsService, notificationCodes} from '../notifications-service';
import {info} from "winston";
import {PrismaService} from "../prisma-service";
import {TradeTypes} from "@prisma/client";


export interface RedistributeObject {
  totalSurplus: number,
  resultTotalSurplus: number,
  surplusCups: number,
  surplusEhId: number,
  redistributePartners: RedistributePartner[]
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
  user_id: number,
  customer_id: number,
  trade_type: TradeTypes
}

// export type TradeTypes = 'PREFERRED' | 'EQUITABLE'

@Injectable()
export class ShareService {
  redistributeObject: RedistributeObject = {
    totalSurplus: 100,
    resultTotalSurplus: 0,
    surplusCups: 20,
    surplusEhId: 0,
    redistributePartners: [
      {consumption: 30, resultConsumption: 0, cupsId: 1, infoDt: new Date, ehId: 1, userId: 1},
      {consumption: 40, resultConsumption: 0, cupsId: 2, infoDt: new Date, ehId: 2, userId: 1},
      {consumption: 10, resultConsumption: 0, cupsId: 3, infoDt: new Date, ehId: 3, userId: 1},
    ]
  };
  private conn: mysql.Pool;
  daysToIgnore = 7;

  newRegisters: RegistersFromDb[] = []

  constructor(
    private mysql: MysqlService,
    private environment: EnvironmentService,
    private notificationService: NotificationsService,
    private prisma: PrismaService
  ) {
    this.conn = this.mysql.pool;

    try {
      //this.redistribute()
    } catch (error) {
      console.log("shares redistribution error", error)
    }

    setInterval(() => {
      //TODO: introduïr condició de si es dia 1 de qualsevol mes, faci el següent:
      try {
        //this.redistribute()
      } catch (error) {
        console.log("shares redistribution error", error)
      }
    }, this.environment.getEnv().TRADE_UPDATE_DAYS * 24 * 60 * 60)
  }

  async redistribute() {
    try {

      console.log("Starting trades update...")

      let surplusRegisters = await this.getNewSurplusRegisters();
      surplusRegisters = await this.deleteDays(surplusRegisters, this.daysToIgnore)
      this.newRegisters = await this.getNewRegisters()

      console.log(`Inserting ${surplusRegisters.length} trades...`)

      for (const surplusRegister of surplusRegisters) {
        console.log(`Trades registers left: ${this.newRegisters.length}`)
        const communityPrice = await this.getCommunityPrice(surplusRegister.community_id)
        let totalSurplus = parseFloat(surplusRegister.kwh_out.toString())

        if (totalSurplus > 0 && surplusRegister.trade_type == 'PREFERRED') {
          const customerCupsRegisters = this.newRegisters
            .filter(
              (register) => register.customer_id == surplusRegister.customer_id)


          if (customerCupsRegisters.length) {
            const redistributeObject = this.getRedistributeObject(totalSurplus, surplusRegister, customerCupsRegisters, surplusRegister.trade_type)
            const calculatedRedistribute = this.calculateRedistribution(redistributeObject)
            await this.insertToTrades(calculatedRedistribute, communityPrice)
            if (redistributeObject.redistributePartners.length) totalSurplus = calculatedRedistribute.resultTotalSurplus
          }

        }
        if (totalSurplus > 0 && this.newRegisters.length) {
          const redistributeObject = this.getRedistributeObject(totalSurplus, surplusRegister, this.newRegisters, "EQUITABLE")

          const calculatedRedistribute = this.calculateRedistribution(redistributeObject)
          await this.insertToTrades(calculatedRedistribute, communityPrice)
        }

      }
    } catch (error) {
      console.log("Error updating trades:", error);
    }

    console.log(`Trades updated.`)
  }

  /*calculateRedistribution(redistributeObject: RedistributeObject) {
    let total = redistributeObject.totalSurplus;
    let partners = redistributeObject.redistributePartners;
    let activePartners = partners.length;
    partners.forEach(partner => {
      partner.resultConsumption = partner.consumption;
    });

    console.log(redistributeObject)

    // Redistribute while it has energy and active partners with consumption
    while (total > 0 && activePartners > 0) {
      let subtractor = Math.floor(total * 1000 / activePartners) / 1000;
      let distributed = 0;
      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i];
        if (partner.resultConsumption > 0) {
          let result = partner.resultConsumption - subtractor;
          console.log(result, "result of:", partner.cupsId)

          if (result < 0) {
            // If consumption == 0, readjust energy left
            distributed += partner.resultConsumption;
            partner.resultConsumption = 0;
            /!*
            this.newRegisters = this.newRegisters.filter(newRegister =>
              !(moment(newRegister.info_dt).isSame( moment(partner.infoDt)) &&
                newRegister.cups_id === partner.cupsId)
            );*!/
            activePartners--;
          } else {
            // Subtract partner consumption
            distributed += subtractor;
            partner.resultConsumption = result;
          }
        }
        this.newRegisters = this.newRegisters.filter(newRegister => newRegister.eh_id != partner.ehId);

      }

      // If energy is not distributed we exit the loop
      if (distributed === 0) break;

      total -= distributed;

      // Si el total es mes petit que el numero de consumidors has de repartir aleatoriament el total a un consumidor i fer un break.
      if (total < activePartners) {
        const partnersWithConsumption = partners.filter((partner) => partner.resultConsumption > 0)

        if (partnersWithConsumption.length) {
          let index = 0

          // Si hay más de un partner, generamos los índices posibles
          let availableIndexes = [...Array(partnersWithConsumption.length).keys()];

          if (availableIndexes.length > 1) {
            index = this.getRandomInt(0, availableIndexes.length - 1);
          }

          let foundValidPartner = false;

          while (!foundValidPartner && availableIndexes.length > 0) {
            let partner = partnersWithConsumption[index];
            let expectedResultConsumption = partner.resultConsumption - total;

            if (expectedResultConsumption > 0) {
              // Si el consumo es válido, actualizamos el valor
              partnersWithConsumption[index].resultConsumption = expectedResultConsumption;
              foundValidPartner = true;
            } else {
              // Si no es válido, eliminamos este índice de los disponibles
              availableIndexes.splice(index, 1);

              // Si todavía quedan índices disponibles, seleccionamos uno nuevo
              if (availableIndexes.length > 0) {
                index = this.getRandomInt(0, availableIndexes.length - 1);
              }
            }
          }

          /!*if (partnersWithConsumption.length > 1)
            index = this.getRandomInt(0, partnersWithConsumption.length - 1)


          while (!foundValidPartner){
            let expectedResultConsumption = partnersWithConsumption[index].resultConsumption-= total
            if (expectedResultConsumption > 0){
              partnersWithConsumption[index].resultConsumption = expectedResultConsumption
              foundValidPartner = true
            }else{
              index = this.getRandomInt(0, partnersWithConsumption.length - 1)
            }
          }*!/



        }

        total = 0
      }
    }

    redistributeObject.resultTotalSurplus = total

    return redistributeObject
  }*/

  calculateRedistribution(redistributeObject: RedistributeObject) {
    //config initial data
    const epsilon = 0.0000000001; // for float comparisons: Math.abs(f1 - f2) < epsilon;
    const totalAvailablePower: number = redistributeObject.totalSurplus;
    let arrForRemove = [];
    //if no power available - early exit
    if (totalAvailablePower <= 0) {
      // set parners to empty array, because
      redistributeObject.redistributePartners = []
      return redistributeObject
    }
    const partners = redistributeObject.redistributePartners;
    const consumers = partners
      .filter(p => p.consumption > epsilon && p.cupsId != redistributeObject.surplusCups)
      .map(p => {
        return {partner: p, desiredPower: p.consumption};
      });
    redistributeObject.redistributePartners = consumers.map(c => c.partner)

    if (consumers.length === 0) {
      console.log('No consumers found. Distribution canceled.');
      return redistributeObject;
    }

    const totalDesiredConsumption: number = consumers.map(consumer => consumer.desiredPower)
      .reduce((a, b) => a + b);

    /*   console.log('distribution begins for: ', redistributeObject);
       console.log('total power to distribute: ', totalDesiredConsumption);
       console.log('consumers: ', consumers);*/

// if totalPower > sum then satisfy all
    if (totalAvailablePower > totalDesiredConsumption) {
      console.log('Enough power for all: choosing straightforward strategy');
      redistributeObject.resultTotalSurplus = totalAvailablePower - totalDesiredConsumption;
      arrForRemove = consumers
      consumers.forEach(c => {
        c.partner.resultConsumption = 0
        this.newRegisters =
          this.newRegisters.filter(newRegister =>
            !((newRegister.cups_id == c.partner.cupsId) && moment(newRegister.info_dt).isSame(moment(c.partner.infoDt))));
      });

      return redistributeObject;
    }

    // sort consumers and loop trough with recalculation even part
    const sortedConsumers = consumers.sort((a, b) => a.desiredPower < b.desiredPower
      ? -1 : (a.desiredPower - b.desiredPower) < epsilon ? 0 : 1);
    // console.log('sorted consumers: ', sortedConsumers);
    let availablePower = totalAvailablePower;
    let i = 0;

    // console.log('Eager strategy begin');
    for (let consumer of sortedConsumers) {
      const evenPart = availablePower / (sortedConsumers.length - i);
      // console.log(`iteration: ${i}, evenPart: ${evenPart}`);
      // if cant satisfy consumer, break the loop and go to next step
      if (evenPart < consumer.desiredPower) break;
      i++
      // console.log('consumer can be satisfied, loop continued')
      availablePower -= consumer.desiredPower;
      consumer.partner.resultConsumption = 0;
      // this.newRegisters = this.newRegisters.filter(newRegister => newRegister.eh_id != consumer.partner.ehId);
      this.newRegisters =
        this.newRegisters.filter(newRegister =>
          !((newRegister.cups_id == consumer.partner.cupsId) && moment(newRegister.info_dt).isSame(moment(consumer.partner.infoDt))));

    }

    // distribute the rest evenly
    const notSatisfiedConsumers = sortedConsumers.slice(i)
    const evenPart = availablePower / notSatisfiedConsumers.length;
    if (!notSatisfiedConsumers.length) console.log("notSatisfiedConsumers is empty!!")

    for (let consumer of notSatisfiedConsumers) {
      let consumption = consumer.partner.consumption;
      consumer.partner.resultConsumption = consumption - evenPart
      const index = this.newRegisters.findIndex(newRegister => newRegister.eh_id === consumer.partner.ehId);

      this.newRegisters[index].kwh_in = consumer.partner.resultConsumption

    }
    // notSatisfiedConsumers.forEach(c => c.partner.resultConsumption = c.partner.consumption - evenPart);
    // console.log(notSatisfiedConsumers, "notSatisfiedConsumers22222")

    redistributeObject.resultTotalSurplus = 0
    // console.log(redistributeObject, "RETURNNN")
    return redistributeObject;

  }

  getRegistersByDateAndCommunity(surplusRegisterDate: Date, communityId: number, newRegisters: RegistersFromDb[]) {
    const date = moment(surplusRegisterDate).format('YYYY-MM-DD HH')
    const filteredRegisters = newRegisters.filter((register) =>
      moment(register.info_dt).format('YYYY-MM-DD HH') == date && communityId == register.community_id
    )

    return filteredRegisters.map(this.formatPartnerObjects)
  }

  getRegistersByDateAndCommunityAndCustomer(surplusRegisterDate: Date, communityId: number, customerId: number, newRegisters: RegistersFromDb[]) {
    const date = moment(surplusRegisterDate).format('YYYY-MM-DD HH')
    const filteredRegisters = newRegisters.filter((register) => {
        if (
          moment(register.info_dt).format('YYYY-MM-DD HH') == date && communityId == register.community_id
          && customerId == register.customer_id) {

          return register
        }
      }
    )

    return filteredRegisters.map(this.formatPartnerObjects)
  }

  getNewSurplusRegisters(): Promise<RegistersFromDb[]> {

    return new Promise(async (resolve, reject) => {
      try {

        let query = `
          SELECT e.id              eh_id,
                 e.kwh_in,
                 e.kwh_out,
                 e.info_dt,
                 cups.id           cups_id,
                 cups.community_id community_id,
                 users.id          user_id,
                 cups.customer_id,
                 trade_type
          FROM energy_hourly e
                 LEFT JOIN cups ON e.cups_id = cups.id
                 LEFT JOIN users ON cups.customer_id = users.customer_id
                 LEFT JOIN communities ON cups.community_id = communities.id
          WHERE  cups.type != 'community'
            AND e.kwh_out > 0
          ORDER BY e.info_dt ASC, e.kwh_out DESC;
        `
        let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
        /*let result: any = await this.prisma.$queryRaw`
         SELECT e.id                   eh_id,
                 e.kwh_in,
                 e.kwh_out,
                 e.info_dt,
                 cups.id                cups_id,
                 cups.community_id      community_id,
                 users.id               user_id,
                 cups.customer_id,
                 trade_type
          FROM energy_hourly e
                 LEFT JOIN trades t ON e.info_dt = t.info_dt
                 LEFT JOIN cups ON e.cups_id = cups.id
                 LEFT JOIN users ON cups.customer_id = users.customer_id
                 LEFT JOIN customers ON cups.customer_id = customers.id
          WHERE t.info_dt IS NULL
            AND cups.type != 'community'
          AND e.kwh_out > 0 AND e.info_dt LIKE '2024-08-19 23%'
          ORDER BY e.info_dt DESC, e.kwh_out DESC;
            `*/
        resolve(result);

      } catch (error) {
        reject(error)
      }
    })

  }

  getNewRegisters(): Promise<RegistersFromDb[] | any[]> {
    return new Promise(async resolve => {
      // let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      // let result: any = await this.prisma.$queryRaw`
      let [result]: any = await this.conn.execute(`
        SELECT e.id              eh_id,
               e.kwh_in,
               e.kwh_out,
               e.info_dt,
               cups.id           cups_id,
               cups.community_id community_id,
               users.id          user_id,
               cups.customer_id,
               trade_type
        FROM energy_hourly e
               LEFT JOIN cups ON e.cups_id = cups.id
               LEFT JOIN users ON cups.customer_id = users.customer_id
               LEFT JOIN communities ON cups.community_id = communities.id
        WHERE cups.type != 'community'
          AND e.kwh_in > 0
        ORDER BY e.info_dt ASC, e.kwh_in DESC;
      `)
      resolve(result);
    })
  }

  // getUserByCustomerId(customerId:number){
  //   return new Promise(async resolve => {
  //     let query = `
  //       SELECT users.id user_id
  //       FROM users
  //       WHERE customer_id = ?
  //     `
  //     let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query,customerId);
  //     resolve(result);
  //   })
  // }

  async customerHasSufficientBalance(tradePrice: any, balance: any) {
    if (balance >= tradePrice) {
      return true;
    } else {
      return false;
    }
  }

  getRedistributeObject(totalSurplus: number, surplusRegister: RegistersFromDb, newRegisters: RegistersFromDb[], type: TradeTypes): RedistributeObject {
    let redistributePartners!: RedistributePartner[];
    if (type == 'PREFERRED')
      redistributePartners =
        this.getRegistersByDateAndCommunityAndCustomer(surplusRegister.info_dt, surplusRegister.community_id, surplusRegister.customer_id, newRegisters)
    else
      redistributePartners = this.getRegistersByDateAndCommunity(surplusRegister.info_dt, surplusRegister.community_id, newRegisters)

    return {
      totalSurplus,
      resultTotalSurplus: 0,
      surplusCups: surplusRegister.cups_id,
      surplusEhId: surplusRegister.eh_id,
      redistributePartners
    }
  }

  async getCustomerFromCupsId(cupsId: number) {
    let query = `SELECT customers.*, users.id as userId
                 FROM customers
                        LEFT JOIN cups ON cups.customer_id = customers.id
                        LEFT JOIN users ON users.customer_id = customers.id
                 WHERE cups.id = ?`
    let [ROWS]: any = await this.conn.execute(query, [cupsId]);
    if (ROWS[0]) {
      return ROWS[0];
    } else {
      throw new Error(`Error getting customer balance. Customer with cups id ${cupsId} not found.`);
    }
  }

  async updateCustomerBalance(customerId: number, balance: number) {
    let query = `UPDATE customers
                 set balance = ?
                 WHERE id = ?`
    try {
      let [ROWS]: any = await this.conn.execute(query, [balance, customerId]);
    } catch (error) {
      console.log('error updating customer balance: ', error)
      throw new Error(`Error updating customer balance ${customerId}: ${error}`);
    }
  }

  async getCommunityPrice(communityId: number) {
    let query = `SELECT energy_price
                 FROM communities
                 WHERE id = ?`
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
    const customerSeller = await this.getCustomerFromCupsId(trade.surplusCups);
    for (const partner of trade.redistributePartners) {
      const tradedKwh = parseFloat((partner.consumption - partner.resultConsumption).toFixed(3)) //deberiamos guardarlo en watts
      const tradeCost = parseFloat((tradedKwh * (communityPrice || 0)).toFixed(3));
      partner.tradeCost = tradeCost;
      partner.tradedKWh = tradedKwh;

      const infoDt = moment(partner.infoDt).format('YYYY-MM-DD HH:mm:ss')
      /*const totalSellSurplus = resultSellTotalKwh
      resultSellTotalKwh -= tradedKwh*/
      const totalSellSurplus = resultSellTotalKwh
      resultSellTotalKwh -= (partner.consumption - partner.resultConsumption)

      const customerBuyer = await this.getCustomerFromCupsId(partner.cupsId);

      partner.buyerName = customerBuyer.name;
      partner.sellerName = customerSeller.name;

      const isSuficientBalance = await this.customerHasSufficientBalance(tradeCost, customerBuyer.balance);

      if (isSuficientBalance && (tradeCost >= 0.001)) {

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
        await this.updateHourlyVirtual(partner.cupsId, partner.resultConsumption, tradedKwh, infoDt, 'BUY')

        //SELL
        query +=
          `(${trade.surplusEhId}, ${partner.ehId}, ${trade.surplusCups}, ${partner.cupsId}, 'SELL', ${tradedKwh}, ${tradeCost}, ${totalSellSurplus}, ${resultSellTotalKwh}, "${infoDt}"),`
        // await this.updateHourlyVirtual(trade.surplusCups, resultSellTotalKwh, trade.totalSurplus - resultSellTotalKwh, infoDt, 'SELL')
        await this.updateHourlyVirtual(trade.surplusCups, trade.resultTotalSurplus, trade.totalSurplus - resultSellTotalKwh, infoDt, 'SELL')


      } else {

        if (tradeCost > 0.001) {

          //insufficient balance notification
          //console.log(`customer ${customerBuyer.name} with cups id ${partner.cupsId} has insufficient balance ${customerBuyer.balance} for the trade cost ${tradeCost} / Trade cost is 0 `)

          //TODO: obtain buyer userId , custom get notification;

          const subjectInsufficientBalance = this.notificationService.getNotificationSubject(notificationCodes.insufficientBalance, this.notificationService.defaultNotificationLang, {
            sharedKW: tradedKwh.toString(),
            tradeCost: tradeCost.toString(),
            customerName: partner.sellerName!,
            infoDt
          });
          //let messageInsufficientBalance = `Your community balance (${customerBuyer.balance} EKW) is innsufficient to buy ${tradedKwh} for the trade cost ${tradeCost} from ${partner.sellerName}`
          let messageInsufficientBalance = `El teu saldo comunitari (${customerBuyer.balance} EKW) es insuficient per comprar a ${partner.sellerName} ${tradedKwh} kW al preu de ${tradeCost}`
          this.notificationService.sendNotification(customerBuyer.userId, notificationCodes.insufficientBalance, subjectInsufficientBalance, messageInsufficientBalance)

        } else {
          //trade cost = 0
        }
      }

    }

    query = query.slice(0, -1);

    if (transactionNumber > 0) { //if (trade.redisitributePartners.length) {

      try {
        let [result] = await this.conn.execute<mysql.ResultSetHeader>(query);
      } catch (error) {
        console.log("error creating trades", error);
        return;
      }

      // const insertedRows = result.affectedRows;
      console.log(`Inserted values on trades from date: ${trade.redistributePartners[0].infoDt}`);

      try { //send notifications

        for (const partner of trade.redistributePartners) {

          const customerBuyer = await this.getCustomerFromCupsId(partner.cupsId);

          const sharedKW = partner.tradedKWh!.toString();
          const tradeCost = partner.tradeCost!.toString();
          const infoDt = moment(partner.infoDt).format('DD-MM-YYYY HH:mm:ss');
          const buyerName = partner.buyerName || '(UNNAMED)';
          const sellerName = partner.sellerName || '(UNNAMED)';

          //notificar al from del sell y al to del buy:

          const subjectSell = this.notificationService.getNotificationSubject(notificationCodes.sharingSent, this.notificationService.defaultNotificationLang, {
            sharedKW,
            tradeCost,
            customerName: buyerName,
            infoDt
          });
          let messageSell = `Shared to ${buyerName}` //l'energia s'ha venut a x
          this.notificationService.sendNotification(customerSeller.userId, notificationCodes.sharingSent, subjectSell, messageSell)

          const subjectBuy = this.notificationService.getNotificationSubject(notificationCodes.sharingReceived, this.notificationService.defaultNotificationLang, {
            sharedKW,
            tradeCost,
            customerName: sellerName,
            infoDt
          });
          let messageBuy = `Shared from ${sellerName}` //l'energia s'ha comprat a x
          this.notificationService.sendNotification(customerBuyer.userId, notificationCodes.sharingReceived, subjectBuy, messageBuy)

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

  /**
   * Updates virtuals from energy hourly
   * @param cupsId
   * @param virtual
   * @param infoDt
   * @param type
   */
  async updateHourlyVirtual(cupsId: number, virtual: number, shared: number, infoDt: string, type: 'BUY' | 'SELL') {
    let query = ''
    if (type == 'BUY') {
      query = `UPDATE energy_hourly
               SET kwh_in_virtual  = ?,
                   kwh_in_shared   = ?,
                   kwh_out_virtual = NULL
               WHERE cups_id = ?
                 AND info_dt LIKE ?`
    } else {
      query = `UPDATE energy_hourly
               SET kwh_out_virtual = ?,
                   kwh_out_shared  = ?,
                   kwh_in_virtual  = NULL
               WHERE cups_id = ?
                 AND info_dt LIKE ?`
    }

    // console.log(query)
    await this.conn.execute(query, [virtual, shared, cupsId, infoDt])
  }

  async deleteDays(registers: RegistersFromDb[], daysToIgnore: number) {
    const date = moment().subtract(daysToIgnore, 'days')
    let updatedRegisters: RegistersFromDb[];
    updatedRegisters = registers.filter(register =>
      moment(register.info_dt).isBefore(date)
    )

    return updatedRegisters;
  }

  formatPartnerObjects(data: RegistersFromDb) {
    let partner: RedistributePartner = {
      consumption: 0,
      cupsId: 0,
      ehId: 0,
      resultConsumption: 0,
      infoDt: new Date,
      userId: 0,
    }
    /* if (data.cups_id == 23 || data.cups_id == 22) console.log(data, "DATAAA")
     if (data.cups_id == 23 || data.cups_id == 22) console.log(moment(data.info_dt).format('YYYY-MM-DD HH'), "DATAAA")*/
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
