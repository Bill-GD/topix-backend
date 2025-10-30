import { DecoratorKeys } from '@/common/decorators';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { Request } from 'express';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    @Inject(DatabaseProviderKey) readonly db: DBType,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.userId || !req.userRole) {
      throw new InternalServerErrorException(
        'User ID or role not found in request.',
      );
    }

    const resource = this.reflector.get<{
      table: MySqlTable;
      resourceUserIdColumn: MySqlColumn;
      resourceIdColumn: MySqlColumn;
      allowAdmin?: boolean;
    }>(DecoratorKeys.resourceOwnerConfig, context.getHandler());

    if (req.userRole === 'admin' && resource.allowAdmin) return true;

    const requestedParam = Number(req.params.id);

    const [{ id: ownerId }] = await this.db
      .select({ id: resource.resourceUserIdColumn })
      .from(resource.table)
      .where(eq(resource.resourceIdColumn, requestedParam));

    if (req.userId !== Number(ownerId)) {
      throw new ForbiddenException('User does not have access to this action.');
    }

    return true;
  }
}
