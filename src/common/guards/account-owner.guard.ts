import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType, JwtUserPayload } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  mixin,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

export function AccountOwnerGuard(allowAdmin: boolean) {
  @Injectable()
  class AccountOwnerMixin implements CanActivate {
    constructor(
      readonly jwt: JwtService,
      @Inject(DatabaseProviderKey) readonly db: DBType,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();

      // should have authenticated guard before this
      const authToken = req.headers.authorization!.split(' ')[1];
      const [{ id: requestedUser }] = await this.db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.username, req.params.username));
      let user: JwtUserPayload;

      try {
        user = this.jwt.verify(authToken);
      } catch (err) {
        throw err instanceof JsonWebTokenError
          ? new UnauthorizedException(err.message)
          : err;
      }

      if (!allowAdmin && user.sub !== requestedUser) {
        throw new ForbiddenException(
          'User does not have access to this action.',
        );
      }

      return true;
    }
  }

  return mixin(AccountOwnerMixin);
}
