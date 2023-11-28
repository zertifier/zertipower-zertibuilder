import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { EnvironmentService } from '../environment-service';

export enum LogLevel {
  LOG = 'log',
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warn',
  ERROR = 'error',
}

const customFormat = winston.format.printf(
  ({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  },
);
/**
 * A winston-logger service implemented with winston
 */
@Injectable()
export class WinstonLogger {
  private readonly logger = winston.createLogger({
    level: 'info',
    levels: {
      log: 0,
      info: 1,
      debug: 2,
      warn: 3,
      error: 4,
    },
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.label({
        label: this.environment.getEnv().APPLICATION_NAME,
      }),
      customFormat,
    ),
    defaultMeta: { service: 'API' },
    transports: [new winston.transports.Console()],
  });

  constructor(private environment: EnvironmentService) {}

  debug(message: string): void {
    this.logger.debug(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  log(message: string): void {
    this.logger.log({ level: LogLevel.LOG, message });
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }
}
