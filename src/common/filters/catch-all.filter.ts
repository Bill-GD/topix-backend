import { ControllerResponse } from '@/common/utils/controller-response';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(error: Error, host: ArgumentsHost) {
    console.log(error.stack);

    let exception = error;

    if (!(exception instanceof HttpException)) {
      exception = new InternalServerErrorException(error);
    }

    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      ControllerResponse.fail(exception as HttpException),
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
