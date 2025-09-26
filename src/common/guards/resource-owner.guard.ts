import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { groupTable, postTable, threadTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  mixin,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { Request } from 'express';

/**
 * Checks whether the requesting user is the owner of the requested resource.
 * Must use after ResourceExistGuard and GetRequesterGuard.
 * The URL must have the resource ID.
 * @param table The resource SQL table.
 * @param resourceUserIdColumn The column that references it's owner.
 * @param resourceIdColumn The column uniquely identify the resource.
 * @param allowAdmin Can admins bypass the check.
 */
function ResourceOwnerGuard(
  table: MySqlTable,
  resourceUserIdColumn: MySqlColumn,
  resourceIdColumn: MySqlColumn,
  allowAdmin: boolean = false,
) {
  @Injectable()
  class ResourceOwnerMixin implements CanActivate {
    constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      if (!req.userId || !req.userRole) {
        throw new InternalServerErrorException(
          'User ID or role not found in request.',
        );
      }

      if (req.userRole === 'admin' && allowAdmin) return true;

      const requestedParam = Number(req.params.id);

      const [{ id: ownerId }] = await this.db
        .select({ id: resourceUserIdColumn })
        .from(table)
        .where(eq(resourceIdColumn, requestedParam));

      if (req.userId !== Number(ownerId)) {
        throw new ForbiddenException(
          'User does not have access to this action.',
        );
      }

      return true;
    }
  }

  return mixin(ResourceOwnerMixin);
}

export const PostOwnerGuard = ResourceOwnerGuard(
  postTable,
  postTable.ownerId,
  postTable.id,
);
export const PostOwnerOrAdminGuard = ResourceOwnerGuard(
  postTable,
  postTable.ownerId,
  postTable.id,
  true,
);
export const ThreadOwnerGuard = ResourceOwnerGuard(
  threadTable,
  threadTable.ownerId,
  threadTable.id,
);
export const GroupOwnerGuard = ResourceOwnerGuard(
  groupTable,
  groupTable.ownerId,
  groupTable.id,
);
