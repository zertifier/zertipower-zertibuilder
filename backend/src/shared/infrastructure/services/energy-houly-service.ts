import mysql from "mysql2/promise";
import {Injectable} from "@nestjs/common";
import {PrismaService} from "./prisma-service";
import {MysqlService} from "./mysql-service";
import * as moment from "moment";
import {CommunitiesDbRequestsService} from "src/features/communities/communities-db-requests.service";
import {EnvironmentService} from "./environment-service";
import {all} from "axios";

interface datadisCupsRegisters {
  community_id: number,
  type: string, //community, consumer, prosumer
  surplus_distribution: number,
  info_dt: string,
  cups_id: number,
  import: number,
  export: number
}

/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class EnergyHourlyService {

  private conn: mysql.Pool;
  datadisMonths: number = this.environmentService.getEnv().DATADIS_MONTHS;

  constructor(
    private mysql: MysqlService, private prisma: PrismaService,
    private communitiesDbRequestsService: CommunitiesDbRequestsService,
    private environmentService: EnvironmentService
  ) {
    this.conn = this.mysql.pool;
  }

  async updateEnergyHourly() {

    const communities = await this.communitiesDbRequestsService.getCommunities();

    const newRegisters: datadisCupsRegisters[] = await this.getNewDatadisRegisters();
    await this.insertNewRegistersToEnergyHourly(newRegisters, communities);

    const registersToUpdate = await this.getDatadisRegistersToUpdateEnergyHourly();
    await this.updateEnergyHourlyRegisters(registersToUpdate, communities)

    this.setPrices();
  }

  /** Get registers from datadis table from last month and the pendant
   * @returns cups and new datadis energy registers
   */
  async getNewDatadisRegisters() {
    const endData = moment('2024-08-29').format('YYYY-MM-DD HH');
    const initData = moment().subtract(this.datadisMonths, 'months').format('YYYY-MM-DD HH');

    try {
      let query = `
      SELECT d.*, cups.type, cups.surplus_distribution, cups.community_id
      FROM datadis_energy_registers d
             LEFT JOIN cups ON d.cups_id = cups.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM energy_hourly e
        WHERE e.info_dt = d.info_dt
          AND e.cups_id = d.cups_id AND info_dt LIKE '2024-08%'
      ) AND info_dt LIKE '2024-08%';
    `/*
    let query = `
      SELECT d.*, cups.type, cups.surplus_distribution, cups.community_id
      FROM datadis_energy_registers d
             LEFT JOIN cups ON d.cups_id = cups.id
      WHERE d.info_dt BETWEEN ? AND ?
        AND NOT EXISTS (SELECT 1
                        FROM energy_hourly e
                        WHERE e.info_dt = d.info_dt
                          AND e.cups_id = d.cups_id
                          AND e.info_dt <= ?);
    `*/

      // let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query, [initData, endData, initData]);
      let [result]: any = await this.conn.execute<mysql.ResultSetHeader>(query);
      let datadisCupsRegisters: datadisCupsRegisters[] = result;

      return datadisCupsRegisters;
    }catch (e) {
      console.log(e)
      return []
    }


    // const endData = moment().format('YYYY-MM-DD HH:mm:ss');
    // const initData = moment().subtract(this.datadisMonths, 'months').format('YYYY-MM-DD HH:mm:ss');
    // console.log(initData, endData)
    // return new Promise(async resolve => {
    //     let query =
    //         `
    //     SELECT d.*, cups.type, cups.surplus_distribution, cups.community_id
    //     FROM datadis_energy_registers d
    //     LEFT JOIN cups ON d.cups_id = cups.id
    //     WHERE d.info_dt BETWEEN ? AND ?;
    //     `
    //     try {
    //         const [ROWS]: any = await this.conn.query(query, [initData, endData]);
    //         const datadisCupsRegisters: datadisCupsRegisters[] = ROWS;
    //         resolve(datadisCupsRegisters);
    //     } catch (error) {
    //         console.log("Error getting new datadis registers", error)
    //         resolve([])
    //     }
    // })
  }

  async insertNewRegistersToEnergyHourly(datadisNewRegisters: any[], communities: any[]) {
    const batchSize = 100;  // Reducir el tamaño del lote a 100 registros por batch

    for (const community of communities) {
      const datadisRegistersByCommunity = this.orderArrByInfoDt(datadisNewRegisters.filter(obj => obj.community_id === community.id));

      console.log(datadisRegistersByCommunity.length, "datadisRegistersByCommunity");

      const allCupsOfCommunity = await this.getCupsByCommunity(community.id);
      let filteredCups = [];

      if (allCupsOfCommunity.length > 0) {
        filteredCups = this.orderArrByInfoDt(
          datadisRegistersByCommunity.concat(this.addNotProvidedCups(datadisNewRegisters, allCupsOfCommunity))
        );
      }

      // Iterar sobre el array de filteredCups en pequeños lotes
      for (let start = 0; start < filteredCups.length; start += batchSize) {
        const batch = filteredCups.slice(start, start + batchSize);

        const valuesPlaceholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const query = `
                INSERT IGNORE INTO energy_hourly (info_dt, kwh_in, kwh_out, production, cups_id, origin, battery, shares)
                VALUES ${valuesPlaceholders}`;

        const queryParams = batch.flatMap(datadisRegister => {
          const info_dt = moment(datadisRegister.info_dt).format('YYYY-MM-DD HH')


          if (datadisRegister.surplus_distribution) {
            const communityExport = datadisRegistersByCommunity.find(obj =>
              obj.type === 'community' &&
              moment(obj.info_dt).format('YYYY-MM-DD HH') === moment(datadisRegister.info_dt).format('YYYY-MM-DD HH')
            );
            const production = communityExport ? communityExport.export * parseFloat(datadisRegister.surplus_distribution) : null;
            return [info_dt, datadisRegister.import, datadisRegister.export, production, datadisRegister.cups_id, 'datadis', 0, datadisRegister.surplus_distribution];
          } else {
            return [info_dt, datadisRegister.import, datadisRegister.export, null, datadisRegister.cups_id, 'datadis', null, null];
          }
        });

        try {
          const [result] = await this.conn.execute<mysql.ResultSetHeader>(query, queryParams);
          const insertedRows = result.affectedRows;
          console.log(`Energy hourly of community ${community.id} inserted with ${insertedRows} rows for batch starting at index ${start}`);
        } catch (error) {
          console.log("Error inserting on energy hourly", error);
          break;  // Opcional: Detener la inserción en caso de error
        }
      }
    }
  }



  async setPrices() {
    this.getTransactionsWithNullPrice().then(async (transactions) => {
      console.log("Updating", transactions.length, "energy hourly registers (prices)...")
      for (const transaction of transactions) {
        const energyData = await this.getEnergyPrice(new Date(transaction.info_dt!), transaction.provider_id)
        transaction.kwh_in_price = energyData.price
        transaction.kwh_out_price = 0.06
        // transaction.kwh_in_price_community = 0.09
        // transaction.kwh_out_price_community = 0.09
        transaction.type = energyData.rate
        this.updatePrices(transaction)
      }
    })
  }

  async getTransactionsWithNullPrice() {
    const transactionsWithNullPrice: any = await this.prisma.$queryRaw`
      SELECT eh.*, cups.community_id, cups.provider_id
      FROM energy_hourly eh
             LEFT JOIN cups ON eh.cups_id = cups.id
      WHERE eh.kwh_in_price IS NULL
         OR eh.kwh_out_price IS NULL;
    `
    return transactionsWithNullPrice;
  }

  async getEnergyPrice(date: Date, providerId: number) {
    let formattedDate = moment(date).format('YYYY-MM-DD')
    let price, energyBlockData: any[];

    try {

      const nonWorkingDayData = await this.prisma.nonWorkingDays.findFirst({
        where: {
          date: new Date(formattedDate),
          providerId
        }
      })

      let data: { rate: string, price: number } = {
        rate: '',
        price: 0
      }

      if (!nonWorkingDayData) {
        formattedDate = moment(date).format('HH:DD:ss')

        energyBlockData = await this.prisma.$queryRaw
          `
            SELECT *
            FROM energy_blocks
            WHERE active_init <= ${formattedDate}
              AND active_end >= ${formattedDate}
              AND provider_id = ${providerId};
          `

        if (energyBlockData.length) {

          const consumptionPrice = energyBlockData[0] ? energyBlockData[0].consumption_price : 0
          price = consumptionPrice
          data.rate = energyBlockData[0].reference || ''
          data.price = price
          return data

        }

      } else {
        data.price = nonWorkingDayData.price || 0
        data.rate = nonWorkingDayData.rate || ''
      }

      return data

    } catch (e) {
      throw new Error(`Get energy price error: energyBlockData",${energyBlockData!},"providerId",${providerId},"formattedDate",${formattedDate},${e}`)
    }

  }

  async updatePrices(data: any) {
    await this.prisma.energyHourly.update({
      where: {
        id: parseInt(data.id),
      },
      data: {
        kwhInPrice: data.kwh_in_price,
        kwhOutPrice: data.kwh_out_price,
        kwhOutVirtual: data.kwh_out,
        type: data.type,
      },
    })
  }

  addNotProvidedCups(existentDatadisCups: any[], allDbCups: any[]) {
    if (allDbCups.length === 0) {
      return [];
    }

    const existingCupsIds = existentDatadisCups.map(cup => cup.cups_id);
    const newCups = allDbCups.filter(cup => !existingCupsIds.includes(cup.id));

    if (!newCups.length) return []

    const formattedNewCups: any = []

    let lastCheckedDate = null

    for (const existentCups of existentDatadisCups) {
      if (lastCheckedDate != moment(existentCups.info_dt).format('YYYY-MM-DD HH:mm:ss')) {
        formattedNewCups.push(...this.formatNewCups(newCups, existentCups))
        lastCheckedDate = moment(existentCups.info_dt).format('YYYY-MM-DD HH:mm:ss')
      }

    }

    return formattedNewCups
  }

  formatNewCups(newCups: any[], existentCups: any) {
    const formattedCups = []
    for (const cups of newCups) {
      formattedCups.push({
        cups_id: cups.id,
        info_dt: existentCups.info_dt,
        import: null,
        export: null,
        /*import: cups.type == 'community' ? existentCups.import : null,
        export: cups.type == 'community' ? existentCups.export : null,*/
        surplus_distribution: cups.surplusDistribution || null,
        community_id: cups.communityId,
        type: cups.type,
        transaction_id: null,
        battery: 0,
        tx_import: null,
        tx_export: null,
        smart_contracts_version: 0
      })
    }

    return formattedCups
  }

  async getCupsByCommunity(communityId: number) {
    return await this.prisma.cups.findMany({
      where: {
        communityId
      }
    });
  }

  async getCupsByCommunityExcludeTypeCommunity(communityId: number) {
    return await this.prisma.cups.findMany({
      where: {
        communityId,
        type: {
          not: "community"
        }
      },
      select: {
        id: true,
        surplusDistribution: true,
        communityId: true,
        providerId: true,
        customerId: true
      }
    });
  }

  orderArrByInfoDt(array: any[]) {
    return array.sort((a: any, b: any) => a.info_dt - b.info_dt);
  }

  async getDatadisRegistersToUpdateEnergyHourly() {
    const endData = moment().format('YYYY-MM-DD HH:mm:ss');
    const initData = moment().subtract(this.datadisMonths, 'months').format('YYYY-MM-DD HH:mm:ss');
    let query = `
      SELECT der.cups_id,
             der.info_dt,
             der.import,
             der.export,
             c.community_id,
             c.surplus_distribution,
             eh.id,
             c.type
      FROM datadis_energy_registers der
             LEFT JOIN energy_hourly eh ON der.info_dt = eh.info_dt AND der.cups_id = eh.cups_id
             LEFT JOIN cups c ON der.cups_id = c.id
      WHERE (der.info_dt BETWEEN ? AND ?)
        AND (
        (eh.kwh_in IS NULL AND der.import IS NOT NULL) OR
        (eh.kwh_in IS NOT NULL AND der.import != eh.kwh_in) OR
        (eh.kwh_out IS NULL AND der.export IS NOT NULL) OR
        (eh.kwh_out IS NOT NULL AND der.export != eh.kwh_out)
        )`


    try {
      const [ROWS]: any = await this.conn.query(query, [initData, endData]);
      const datadisRegisters = ROWS;

      /*//Check if it's community and if it is add the cups of the community to update each
      for (const datadisRegister of datadisRegisters) {
        if (datadisRegister.type == 'community')
          datadisRegister.consumers = await this.getCupsByCommunityExcludeTypeCommunity(datadisRegister.community_id)
      }*/

      console.log("datadisRegisters length ", datadisRegisters.length, "from", initData, "to", endData)
      return datadisRegisters;
    } catch (error) {
      console.log("Error getting datadis registers to update energy hourly", error)
      return [];
    }
  }

  async updateEnergyHourlyRegisters(registersToUpdate: any[], communities: any[]) {
    for (const community of communities) {
      // Get datadis registers for the community
      let datadisRegistersByCommunity = registersToUpdate.filter(obj => obj.community_id === community.id);

      // Order registers by info_dt if there are any new registers
      if (registersToUpdate.length > 0) {
        datadisRegistersByCommunity = this.orderArrByInfoDt(datadisRegistersByCommunity);
      }

      // Get all CUPS of the community
      const allCupsOfCommunity = await this.getCupsByCommunityExcludeTypeCommunity(community.id);

      const filteredCups = allCupsOfCommunity.length > 0 ? datadisRegistersByCommunity : [];

      // Define the batch size
      const batchSize = 1000;

      // Iterate over the filteredCups array in batches
      for (let start = 0; start < filteredCups.length; start += batchSize) {
        // Extract a slice of batchSize from filteredCups
        const batch = filteredCups.slice(start, start + batchSize);

        // Construct the query parts for this batch
        const ids = batch.map(register => register.id);

        const cases = {
          kwh_in: '',
          kwh_out: '',
          production: ''
        };

        let queryParams: any[] = [];

        let auxiliarIds: number[] = [];
        let importArray: number[] = [];
        let exportArray: number[] = [];
        let productionArray: number[] = [];
        let importArrayParams: number[] = [];
        let exportArrayParams: number[] = [];
        let productionArrayParams: number[] = [];

        batch.forEach((datadisRegister) => {
          let production: number = 0;

          if (datadisRegister.surplus_distribution) {
            const communityExport = datadisRegistersByCommunity.find(obj =>
              moment(obj.info_dt).format('YYYY-MM-DD HH:mm') === moment(datadisRegister.info_dt).format('YYYY-MM-DD HH:mm')
              && obj.type == 'community'
            );
            production = communityExport ? communityExport.export *  parseFloat(datadisRegister.surplus_distribution) : 0;
          }

          // console.log(datadisRegister, "DATADIS")
          if (datadisRegister.type == 'community')
            this.updateConsumers(allCupsOfCommunity, datadisRegister.export || 0 , datadisRegister.info_dt)

          cases.kwh_in += `WHEN ? THEN ? `;
          cases.kwh_out += `WHEN ? THEN ? `;
          cases.production += `WHEN ? THEN ? `;

          importArray.push(datadisRegister.import)
          exportArray.push(datadisRegister.export)
          productionArray.push(production)
          auxiliarIds.push(datadisRegister.id)

        });


        //TODO: organizar query params
        for (let i = 0; i < auxiliarIds.length; i++) {
          importArrayParams.push(auxiliarIds[i], importArray[i])
          exportArrayParams.push(auxiliarIds[i], exportArray[i])
          productionArrayParams.push(auxiliarIds[i], productionArray[i])
        }

        queryParams = (importArrayParams).concat(exportArrayParams).concat(productionArrayParams)

        // Construct the final query
        const query = `
          UPDATE energy_hourly
          SET kwh_in = CASE id ${cases.kwh_in} ELSE kwh_in END, kwh_out = CASE id ${cases.kwh_out} ELSE kwh_out END, production = CASE id ${cases.production} ELSE production END
          WHERE id IN (${ids.map(() => '?').join(',')})
        `;

        queryParams.push(...ids);

        if (filteredCups.length) {
          try {
            // Execute the query for this batch
            const [result] = await this.conn.execute<mysql.ResultSetHeader>(query, queryParams);
            const updatedRows = result.affectedRows;
            console.log(`Energy hourly of community ${community.id} updated with a total of ${updatedRows} rows for batch starting at index ${start}`);
          } catch (error) {
            console.log("Error updating on energy hourly", error);
            throw new Error('Error updating');
          }
        }
      }
    }
  }

  async updateConsumers(consumers: any[], communityExport: number, date: string) {
    let query = 'UPDATE energy_hourly SET production = CASE';
    let queryParams: any[] = [];

    for (const consumer of consumers) {
      const kwhResult = (consumer.surplusDistribution || 0) * communityExport;
      query += `
        WHEN cups_id = ? THEN ?
      `;

      queryParams.push(consumer.id, kwhResult);
    }


    query += ` 
      END 
      WHERE cups_id IN (` + consumers.map(() => '?').join(', ') + `) 
      AND info_dt LIKE ?
    `;
    queryParams.push(...consumers.map(consumer => consumer.id));
    queryParams.push(date)

    //Thanks AI

    const [result] = await this.conn.execute<mysql.ResultSetHeader>(query, queryParams);
    // console.log(`Updated production of ${result.affectedRows} from ${moment(date).format('YYYY-MM-DD HH:mm')}`)

  }

  // async updateEnergyHourlyRegisters(registersToUpdate: any[], communities: any[]) {

  //     for (const community of communities) {

  //         // Get datadis registers for the community
  //         let datadisRegistersByCommunity = registersToUpdate.filter(obj => obj.community_id === community.id);

  //         // Order registers by info_dt if there are any new registers
  //         if (registersToUpdate.length > 0) {
  //             datadisRegistersByCommunity = this.orderArrByInfoDt(datadisRegistersByCommunity);
  //         }

  //         // Get all CUPS of the community
  //         const allCupsOfCommunity = await this.getCupsByCommunity(community.id);

  //         const filteredCups = allCupsOfCommunity.length > 0 ? datadisRegistersByCommunity : [];

  //         // Define the batch size
  //         const batchSize = 10;

  //         // Iterate over the filteredCups array in batches
  //         for (let start = 0; start < filteredCups.length; start += batchSize) {
  //             // Extract a slice of batchSize from filteredCups
  //             const batch = filteredCups.slice(start, start + batchSize);

  //             // Construct the query and parameters for this batch
  //             let query:string = '';
  //             let queryParams:any = [];

  //             batch.forEach((datadisRegister) => {

  //                 query += `
  //                 UPDATE energy_hourly
  //                 SET
  //                     kwh_in = ?,
  //                     kwh_out = ?,
  //                     production = ?,
  //                     origin = ?,
  //                     battery = ?,
  //                     shares = ?
  //                 WHERE id = ?;
  //                 `;

  //                 let production: any = null;

  //                 if (datadisRegister.surplus_distribution) {
  //                     const communityExport = datadisRegistersByCommunity.find(obj =>
  //                         moment(obj.info_dt).format('YYYY-MM-DD HH:mm') === moment(datadisRegister.info_dt).format('YYYY-MM-DD HH:mm')
  //                     );
  //                     production = communityExport ? communityExport.export * datadisRegister.surplus_distribution  : null;
  //                 }

  //                 queryParams.push(
  //                     datadisRegister.import, // kwh_in
  //                     datadisRegister.export, // kwh_out
  //                     production,      // production
  //                     'datadis',       // origin
  //                     datadisRegister.surplus_distribution, // shares
  //                     datadisRegister.id
  //                 );
  //             });

  //             if (filteredCups.length) {
  //                 try {
  //                     // Execute the query for this batch
  //                     const [result] = await this.conn.execute<mysql.ResultSetHeader>(query, queryParams);
  //                     const updatedRows = result.affectedRows;
  //                     console.log(`Energy hourly of community ${community.id} updated with a total of ${updatedRows} rows for batch starting at index ${start}`);
  //                 } catch (error) {
  //                     console.log("Error inserting on energy hourly", error)
  //                     throw new Error('Error updating')
  //                 }
  //             }
  //         }
  //     }
  // }
}

