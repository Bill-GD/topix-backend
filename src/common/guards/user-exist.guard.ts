import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  mixin,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

/**
 * Checks whether the request param actually points to an existing user.
 * @param check What to check in the param
 */
export function UserExistGuard(check: 'id' | 'username') {
  class UserExistMixin implements CanActivate {
    constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      let count = 0;

      if (check === 'username') {
        count = await this.db.$count(
          userTable,
          eq(userTable.username, req.params.username),
        );
      }

      if (check === 'id' && !isNaN(Number(req.params.id))) {
        count = await this.db.$count(
          userTable,
          eq(userTable.id, Number(req.params.id)),
        );
      }

      if (count <= 0) {
        throw new NotFoundException(`User doesn't exist.`);
      }
      return true;
    }
  }

  return mixin(UserExistMixin);
}
