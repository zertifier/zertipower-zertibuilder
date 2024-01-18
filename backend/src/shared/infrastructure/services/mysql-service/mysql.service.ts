import { Injectable } from "@nestjs/common";
import * as mysql from "mysql2/promise";
import { EnvironmentService } from "../environment-service";

/**
 * Service that wraps mysql pool connection
 */
@Injectable()
export class MysqlService {
  public pool: mysql.Pool;

  constructor(private environment: EnvironmentService) {
    this.pool = mysql.createPool({
      host: "46.253.45.22",
      user: "root",
      password: "Meg@tr@IPFS_7a7s7d7f7g8h8j8k8l",
      database: "zertipowerv2",
      connectionLimit: 25,
      // uri: this.environment.getEnv().DATABASE_URL,
    });
  }
}
