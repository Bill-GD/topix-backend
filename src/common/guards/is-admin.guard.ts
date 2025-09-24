import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.userId || !req.userRole) {
      throw new InternalServerErrorException(
        'User ID or role not found in request.',
      );
    }

    return req.userRole === 'admin';
  }
}
