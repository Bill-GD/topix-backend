import { JwtUserPayload } from '@/common/utils/types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export function AccountOwnerGuard(allowAdmin: boolean) {
  @Injectable()
  class AccountOwnerMixin implements CanActivate {
    constructor(readonly jwt: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest<Request>();

      // should have authenticated guard before this
      const authToken = req.headers.authorization!.split(' ')[1];
      const requestedUser = req.params.username;
      let user: JwtUserPayload;

      try {
        user = this.jwt.verify(authToken);
      } catch (err) {
        throw err instanceof JsonWebTokenError
          ? new UnauthorizedException(err.message)
          : err;
      }

      if (!allowAdmin && user.username !== requestedUser) {
        throw new ForbiddenException(
          'User does not have access to this action.',
        );
      }

      return true;
    }
  }

  return mixin(AccountOwnerMixin);
}
