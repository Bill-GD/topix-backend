import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  mixin,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

      const [{ id: requestedUser }] = await this.db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.username, req.params.username));

      if (!allowAdmin && req.userId !== requestedUser) {
        throw new ForbiddenException(
          'User does not have access to this action.',
        );
      }

      return true;
    }
  }

  return mixin(AccountOwnerMixin);
}
