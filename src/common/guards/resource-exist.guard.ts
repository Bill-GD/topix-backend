import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { postTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  mixin,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { Request } from 'express';

/**
 * Checks whether the requested resource exists.
 * @param table The resource SQL table.
 * @param resourceIdColumn The column that uniquely identify the resource.
 */
function ResourceExistGuard(table: MySqlTable, resourceIdColumn: MySqlColumn) {
  class ResourceExistMixin implements CanActivate {
    constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();

      const count = await this.db.$count(
        table,
        eq(resourceIdColumn, Number(req.params.id)),
      );

      if (count <= 0) {
        throw new NotFoundException(`Resource doesn't exist.`);
      }
      return true;
    }
  }

  return mixin(ResourceExistMixin);
}

export const PostExistGuard = ResourceExistGuard(postTable, postTable.id);
