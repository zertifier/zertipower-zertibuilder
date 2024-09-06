import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import { LogsService } from "src/shared/infrastructure/services/logs-service";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/infrastructure/services";
import { SaveCustomersDTO } from "./save-customers-dto";
import * as moment from "moment";
import { notificationCodes, NotificationsService } from "src/shared/infrastructure/services/notifications-service";

@Injectable()
export class CustomersDbRequestsService {

    private conn: mysql.Pool;

    constructor(
        private mysql: MysqlService,
        private prisma: PrismaService,
        private logsService: LogsService,
        private notificationService: NotificationsService) {
        this.conn = this.mysql.pool;
        this.watchBalances();
    }

    watchBalances() {
        this.notifyLowBalances();
        setInterval(async () => {
            this.notifyLowBalances();
        }, 24 * 60 * 60 * 1000); // Ejecutar cada 24 horas (86400000 milisegundos)
    }

    async notifyLowBalances() {
        const currentDate = moment().format('DD-MM-YYYY');
        const customersUsers = await this.getCustomersUsers();
        customersUsers.map((customerUser: any) => {
            if (customerUser.user_id && customerUser.balance < 5) {
                //inform to user that has low balance
                const subjectLowBalance = this.notificationService.getNotificationSubject(notificationCodes.lowBalance, this.notificationService.defaultNotificationLang, { infoDt: currentDate });
                let messageLowBalance = `El teu saldo comunitari es de ${customerUser.balance} EKW a data de ${currentDate}`
                this.notificationService.sendNotification(customerUser.user_id, notificationCodes.lowBalance, subjectLowBalance, messageLowBalance)
            }
        })
    }

    async getCustomers(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const getCustomersQuery = `SELECT *
                                   FROM customers`;
                let [ROWS]: any = await this.conn.query(getCustomersQuery);
                resolve(ROWS);
            } catch (e) {
                console.log("error getting customers", e);
                reject(e)
            }
        })
    }

    async getCustomersUsers(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const getCustomersQuery = `SELECT customers.*, users.id as user_id
                                   FROM customers
                                   LEFT JOIN users
                                   ON users.customer_id = customers.id`;
                let [ROWS]: any = await this.conn.query(getCustomersQuery);
                resolve(ROWS);
            } catch (e) {
                console.log("error getting customers", e);
                reject(e)
            }
        })
    }


    async getCustomerById(customerId: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const customer = await this.prisma.customers.findUnique({
                    where: {
                        id: customerId
                    },
                });
                resolve(customer)
            } catch (e) {
                console.log("error getting customer", e);
                reject(e)
            }
        })
    }

    async updateCustomerParams(customerId: number, paramsToUpdate: SaveCustomersDTO) {

        try {

            if (!customerId || !paramsToUpdate) {
                throw new Error('No parameters provided for update');
            }

            await this.prisma.customers.update({
                where: { id: customerId },
                data: paramsToUpdate
            });

        } catch (error) {
            console.error('Error updating customer:', error);
            throw new Error(`Error updating customer: ${error}`)
        }

    }

    async getByIdStatsDaily(customerId: string, origin: string, date: string) {
        let data: any = await this.prisma.$queryRaw`
        SELECT 
            SUM(kwh_in)                  AS kwh_in,
               SUM(kwh_out)                 AS kwh_out,
               SUM(kwh_out_virtual)         AS kwh_out_virtual,
               SUM(kwh_in_virtual)         AS kwh_in_virtual,
               kwh_in_price            AS kwh_in_price,
               kwh_out_price           AS kwh_out_price,
               kwh_in_price_community  AS kwh_in_price_community,
               kwh_out_price_community AS kwh_out_price_community,
               DATE(info_dt)                AS info_dt,
               SUM(production) production
        FROM energy_hourly
        LEFT JOIN cups
        ON cups.id = energy_hourly.cups_id
        WHERE DATE(info_dt) = ${date}
          AND cups.customer_id = ${customerId}
          AND origin = ${origin}
        GROUP BY HOUR(info_dt)
        ORDER BY info_dt;
      `;
        data = this.dataWithEmpty(data, date, 24, 'daily')
        const mappedData = data.map(this.energyRegistersMapData);
        let dataToSend = { stats: [] }
        dataToSend.stats = mappedData
        return dataToSend;
    }

    async getByIdStatsMonthly(customerId: string, origin: string, date: string) {
        const [year, month] = date.split('-');

        let data: any = await this.prisma.$queryRaw`
        SELECT a.*,
               SUM(kwh_in)                  AS kwh_in,
               SUM(kwh_out)                 AS kwh_out,
               SUM(kwh_out_virtual)         AS kwh_out_virtual,
               SUM(kwh_in_virtual)         AS kwh_in_virtual,
               kwh_in_price            AS kwh_in_price,
               kwh_out_price           AS kwh_out_price,
               kwh_in_price_community  AS kwh_in_price_community,
               kwh_out_price_community AS kwh_out_price_community,
               DATE(a.info_dt)                AS info_dt,
               SUM(production) production
        FROM energy_hourly a
               LEFT JOIN
             (SELECT sum(kwh_out) as total_surplus,
                     info_dt
              FROM energy_hourly eh
                     LEFT JOIN
                   cups cu
                   ON eh.cups_id = cu.id
              WHERE (cu.type = 'community' OR cu.type = 'prosumer')
                AND YEAR(info_dt) = ${parseInt(year)}
                AND MONTH(info_dt) = ${parseInt(month)}
              GROUP BY DAY(info_dt)
              ORDER BY info_dt) b
             ON a.info_dt = b.info_dt
               LEFT JOIN cups cp ON cp.id = a.cups_id
        WHERE YEAR(a.info_dt) = ${parseInt(year)}
          AND MONTH(a.info_dt) = ${parseInt(month)}
          AND customer_id = ${customerId}
          AND origin = ${origin}
        GROUP BY DAY(a.info_dt)
        ORDER BY a.info_dt;
      `;

        const daysOfMonth = moment(date).daysInMonth()
        data = this.dataWithEmpty(data, date, daysOfMonth, 'monthly')

        const mappedData = data.map(this.energyRegistersMapData);
        let dataToSend = { stats: [] }
        dataToSend.stats = mappedData
        return dataToSend

    }

    async getByIdStatsYearly(customerId: string, origin: string, date: string) {
        const [year] = date.split('-');

        let data: any = await this.prisma.$queryRaw`
        SELECT a.*,
               SUM(kwh_in)                  AS         kwh_in,
               SUM(kwh_out)                 AS         kwh_out,
               SUM(kwh_out_virtual)         AS         kwh_out_virtual,
               SUM(kwh_in_virtual)         AS kwh_in_virtual,
               kwh_in_price          AS         kwh_in_price,
               kwh_out_price           AS         kwh_out_price,
               kwh_in_price_community  AS         kwh_in_price_community,
               kwh_out_price_community AS         kwh_out_price_community,
               DATE(a.info_dt)              AS         info_dt,
               SUM(production) production
        FROM energy_hourly a
               LEFT JOIN
             (SELECT sum(kwh_out) as total_surplus,
                     info_dt
              FROM energy_hourly eh
                     LEFT JOIN
                   cups cu
                   ON eh.cups_id = cu.id
              WHERE (cu.type = 'community' OR cu.type = 'prosumer')
                AND YEAR(info_dt) = ${parseInt(year)}
              GROUP BY MONTH(info_dt)
              ORDER BY info_dt) b
             ON a.info_dt = b.info_dt
               LEFT JOIN cups cp ON cp.id = a.cups_id
        WHERE YEAR(a.info_dt) = ${parseInt(year)}
          AND customer_id = ${customerId}
          AND origin = ${origin}
        GROUP BY MONTH(a.info_dt)
        ORDER BY a.info_dt;
      `;

        data = this.dataWithEmpty(data, date, 12, 'yearly')
        const mappedData = data.map(this.energyRegistersMapData);
        let dataToSend = { stats: [] }
        dataToSend.stats = mappedData;
        return dataToSend;

    }

    energyRegistersMapData(data: any) {
        const mappedData: any = {};
        mappedData.id = data.id;
        mappedData.infoDt = data.infoDt || data.info_dt;
        //mappedData.cupsId = data.cupsId || data.cups_id;
        mappedData.origin = data.origin;
        mappedData.kwhIn = data.kwhIn || data.kwh_in;
        mappedData.kwhOut = data.kwhOut || data.kwh_out;
        mappedData.kwhOutVirtual = data.kwhOutVirtual || data.kwh_out_virtual;
        mappedData.kwhInVirtual = data.kwhInVirtual || data.kwh_in_virtual;
        mappedData.kwhInPrice = data.kwhInPrice || data.kwh_in_price;
        mappedData.kwhOutPrice = data.kwhOutPrice || data.kwh_out_price;
        mappedData.kwhInPriceCommunity = data.kwhInPriceCommunity || data.kwh_in_price_community;
        mappedData.kwhOutPriceCommunity = data.kwhOutPriceCommunity || data.kwh_out_price_community;
        mappedData.type = data.type;
        mappedData.active = data.active ? data.active : 1;
        mappedData.production = data.production ? data.production : 0;
        mappedData.generation = data.generation;
        mappedData.createdAt = data.createdAt || data.created_at;
        mappedData.updatedAt = data.updatedAt || data.updated_at;
        return mappedData;
    }

    dataWithEmpty(data: any, date: string, qty: number, type: 'yearly' | 'monthly' | 'daily') {
        if (data.length < qty) {
            for (let i = 0; i < qty; i++) {
                let formattedDate;
                if (type == 'daily') {
                    const hour = i.toString().length > 1 ? i : `0${i}`
                    formattedDate = `${date} ${hour}:00:00`
                }

                if (type == 'monthly') {
                    const day = (i + 1).toString().length > 1 ? i + 1 : `0${i + 1}`
                    formattedDate = `${date}-${day} 01:00:00`
                }

                if (type == 'yearly') {
                    const month = (i + 1).toString().length > 1 ? i + 1 : `0${i + 1}`
                    formattedDate = `${date}-${month}-01 01:00:00`
                }


                const newDate = moment.utc(formattedDate).toDate()

                const sameDate = data.find((item: any) => {
                    if (type == 'daily' && item.info_dt)
                        return item.info_dt.toString() == newDate.toString()

                    if (type == 'monthly' && item.info_dt) {
                        const dayOfItem = moment(item.info_dt).format('YYYY-MM-DD')
                        const dayOfNewDate = moment(newDate).format('YYYY-MM-DD')
                        return dayOfItem == dayOfNewDate
                    }

                    if (type == 'yearly' && item.info_dt) {
                        const monthOfItem = moment(item.info_dt).format('YYYY-MM')
                        const monthOfNewDate = moment(newDate).format('YYYY-MM')
                        return monthOfItem == monthOfNewDate
                    }

                    return

                });
                if (!sameDate) {
                    const cupEmptyObject = {
                        "id": 0,
                        "cups_id": 0,
                        "info_dt": newDate,
                        "type": "",
                        "origin": "datadis",
                        "kwh_in": 0,
                        "kwh_out": 0,
                        "kwh_out_virtual": 0,
                        "kwh_in_price": 0,
                        "kwh_out_price": 0,
                        "kwh_in_price_community": 0,
                        "kwh_out_price_community": 0,
                        "production": 0,
                        "created_at": newDate,
                        "updated_at": newDate,
                        "community_id": 7
                    }

                    data.splice(i, 0, cupEmptyObject)
                }
            }
        }
        return data
    }

}
