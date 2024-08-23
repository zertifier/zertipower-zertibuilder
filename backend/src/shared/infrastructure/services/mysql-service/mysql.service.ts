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
    //this.pool = mysql.createPool(this.environment.getEnv().DATABASE_URL);
    const host = this.environment.getEnv().DB_HOST
    const user = this.environment.getEnv().DB_USER 
    const pwd = this.environment.getEnv().DB_PASSWORD
    const database = this.environment.getEnv().DB_DATABASE
    this.pool = mysql.createPool({
      host: host,
      user: user,
      password: pwd,
      database: database,
      connectionLimit: 30,
  });
      
  }
}
