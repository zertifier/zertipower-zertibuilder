import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { EnvironmentService } from '../environment-service';

/**
 * Service that wraps mysql pool connection
 */
@Injectable()
export class MysqlService {
  public pool: mysql.Pool;

  constructor(private environment: EnvironmentService) {
    this.pool = mysql.createPool({
      uri: this.environment.getEnv().DATABASE_URL,
    });
  }
}
