import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import { LogsService } from "src/shared/infrastructure/services/logs-service";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/infrastructure/services";
import { SaveCustomersDTO } from "./save-customers-dto";

@Injectable()
export class CustomersDbRequestsService {

    private conn: mysql.Pool;

    constructor(
        private mysql: MysqlService,
        private prisma: PrismaService,
        private logsService: LogsService) {
        this.conn = this.mysql.pool;
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

            if (!paramsToUpdate || paramsToUpdate) {
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
