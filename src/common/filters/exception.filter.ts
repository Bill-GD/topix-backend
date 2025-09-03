import { ControllerResponse } from '@/common/utils/controller-response';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';

@Catch()
export class CatchAllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Error, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const http = host.switchToHttp();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    console.log(exception.stack);

    const res = ControllerResponse.fail(
      exception instanceof HttpException
        ? exception.message
        : 'An error has occurred',
      exception,
      status,
    );

    httpAdapter.reply(http.getResponse<Response>(), res, status);
  }
}
