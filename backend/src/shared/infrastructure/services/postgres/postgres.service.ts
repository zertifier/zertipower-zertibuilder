import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { EnvironmentService } from '../environment-service';

@Injectable()
export class PostgresService {
  public pool: Pool;
  constructor(private environment: EnvironmentService) {
    this.pool = new Pool({
      connectionString: this.environment.getEnv().DATABASE_URL,
    });
  }
}
