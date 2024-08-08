import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import mysql from "mysql2/promise";
import { LogsService } from "src/shared/infrastructure/services/logs-service";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/infrastructure/services";

@Injectable()
export class UsersDbRequestsService {

    private conn: mysql.Pool;

    constructor(
        private mysql: MysqlService,
        private prisma: PrismaService,
        private logsService: LogsService) {
        this.conn = this.mysql.pool;
    }

    async getUsers(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const users = await this.prisma.user.findMany();
                resolve(users);
            } catch (e) {
                console.log("error getting customers", e);
                reject(e)
            }
        })
    }

    async getUserById(userId: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await this.prisma.user.findUnique({
                    where: {
                        id: userId,
                    },
                });
                resolve(user)
            } catch (e) {
                console.log("error getting user", e);
                reject(e)
            }
        })
    }
}
