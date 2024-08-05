import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import { LogsService } from "src/shared/infrastructure/services/logs-service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CommunitiesDbRequestsService {

    private conn: mysql.Pool;

    constructor(
        private mysql: MysqlService,
        private logsService: LogsService) {
        this.conn = this.mysql.pool;
    }

    async getCommunities(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const getCommunitiesQuery: string = `SELECT *
                                            FROM communities`;
                let [ROWS]: any = await this.conn.query(getCommunitiesQuery);
                resolve(ROWS);
            } catch (e) {
                console.log("error getting communities", e);
                reject(e)
            }
        })
    }
}
