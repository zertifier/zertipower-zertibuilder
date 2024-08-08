import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import { LogsService } from "src/shared/infrastructure/services/logs-service";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/infrastructure/services";

@Injectable()
export class CupsDbRequestsService {

  private conn: mysql.Pool;

  constructor(
    private mysql: MysqlService,
    private prisma: PrismaService,
    private logsService: LogsService) {
    this.conn = this.mysql.pool;
  }

  async getCups(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const getCupsQuery = `SELECT *
                                  FROM cups`;
        let [ROWS]: any = await this.conn.query(getCupsQuery);
        resolve(ROWS);
      } catch (e) {
        console.log("error getting cups", e);
        reject(e)
      }
    })
  }

  async getCupsById(cupsId: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const cups = await this.prisma.cups.findUnique({
          where: {
            id: cupsId
          },
        });
        resolve(cups)
      } catch (e) {
        console.log("error getting cups", e);
        reject(e)
      }
    })
  }

  async getCupsByCustomerId(customerId: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const cups = await this.prisma.cups.findMany({
          where: {
            customerId: customerId
          },
        });
        resolve(cups[0])
      } catch (e) {
        console.log("error getting cups", e);
        reject(e)
      }
    })
  }
}
