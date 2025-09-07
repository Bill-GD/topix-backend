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
import { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { Request } from 'express';

/**
 * Checks whether the requesting user is the owner of the requested resource.
 * @param param The param of the URL.
 * @param table The resource SQL table.
 * @param resourceUserIdColumn The column that references it's owner.
 * @param allowAdmin Can admins bypass the check.
 */
export function ResourceOwnerGuard(
  param: 'id' | 'username',
  table: MySqlTable,
  resourceUserIdColumn: MySqlColumn,
  allowAdmin: boolean = false,
) {
  @Injectable()
  class ResourceOwnerMixin implements CanActivate {
    constructor(
      readonly jwt: JwtService,
      @Inject(DatabaseProviderKey) readonly db: DBType,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      if (allowAdmin) return true;

      const req = context.switchToHttp().getRequest<Request>();

      // should have authenticated guard before this
      const authToken = req.headers.authorization!.split(' ')[1];
      const requestedParam = req.params[param];

      let query = this.db
        .select({ id: resourceUserIdColumn })
        .from(table)
        .$dynamic();
      switch (param) {
        case 'username':
          query = query.where(eq(userTable.username, requestedParam));
          break;
        case 'id':
          if (table === userTable) {
            query = query.where(
              eq(resourceUserIdColumn, Number(requestedParam)),
            );
          } else {
            query = query
              .innerJoin(userTable, eq(userTable.id, resourceUserIdColumn))
              .where(eq(resourceUserIdColumn, Number(requestedParam)));
          }
          break;
      }
      const [{ id: ownerId }] = await query;

      let user: JwtUserPayload;

      try {
        user = this.jwt.verify(authToken);
      } catch (err) {
        throw err instanceof JsonWebTokenError
          ? new UnauthorizedException(err.message)
          : err;
      }

      if (user.sub !== Number(ownerId)) {
        throw new ForbiddenException(
          'User does not have access to this action.',
        );
      }

      return true;
    }
  }

  return mixin(ResourceOwnerMixin);
}
