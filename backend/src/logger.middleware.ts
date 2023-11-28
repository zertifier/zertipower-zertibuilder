import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from './shared/infrastructure/services';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private logger: WinstonLogger) {}
  use(request: Request, response: Response, next: NextFunction) {
    const { ip, method, originalUrl: url } = request;

    response.on('close', () => {
      const { statusCode } = response;

      this.logger.log(`${method} ${url} ${statusCode} - ${ip}`);
    });

    next();
  }
}
