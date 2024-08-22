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

}
