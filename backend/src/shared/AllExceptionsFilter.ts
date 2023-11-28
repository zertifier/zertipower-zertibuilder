import { HttpAdapterHost } from '@nestjs/core';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationError, ErrorCode } from './domain/error';
import { HttpResponse } from './infrastructure/http/HttpResponse';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let message: string;
    let errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let data: any;

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      message = exception.message;
      if (
        exception.getStatus() >= HttpStatus.BAD_REQUEST &&
        exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        errorCode = ErrorCode.BAD_REQUEST;
        const response = exception.getResponse() as any;
        data = { errors: response.message };
      }
    } else if (exception instanceof ApplicationError) {
      message = exception.message;
      errorCode = exception.errorCode;
      const metadata = exception.metadata;
      if (metadata) {
        console.warn(metadata);
      }
    } else {
      message = 'Internal server errors';
    }

    console.error(exception);

    const responseBody = HttpResponse.failure(message, errorCode).withData(
      data,
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
