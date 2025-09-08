import { ControllerResponse } from '@/common/utils/controller-response';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((res) => {
        const typed = res as ControllerResponse;
        response.status(typed.status);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return res;
      }),
    );
  }
}
