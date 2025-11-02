import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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

    if (req.userRole !== 'admin') {
      throw new ForbiddenException('User does not have access to this action.');
    }

    return true;
  }
}
