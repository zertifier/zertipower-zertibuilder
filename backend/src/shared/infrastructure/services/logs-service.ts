import { Injectable } from "@nestjs/common";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";

/**
 * Service used to interact with the datadis api
 */
@Injectable()
export class LogsService {

    private conn: mysql.Pool;

    constructor(private mysql: MysqlService){
        this.conn = this.mysql.pool;
    }

    async postLogs(cups: string, cupsId: number, operation: string, n_registers: number, startDate: any, endDate: any, getDatadisBegginningDate: any, getDatadisEndingDate: any, status: string, errorType: string, errorMessage: string) {

        const log = {
          cups,
          n_registers,
          startDate,
          endDate,
          status: status,
          errorType,
          errorMessage,
          getDatadisBegginningDate,
          getDatadisEndingDate
        };
    
        const insertLogQuery = `INSERT INTO logs (origin, log, cups, cups_id, status, operation, n_affected_registers,
                                                  error_message)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    
        try {
          let [ROWS] = await this.conn.query(insertLogQuery, ['datadis', JSON.stringify(log), cups, cupsId, status, operation, n_registers, errorMessage]);
        } catch (e: any) {
          console.log("error inserting logs energy data", e);
        }
    
      }
}
