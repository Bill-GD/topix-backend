import { DecoratorKeys } from '@/common/decorators';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { Request } from 'express';

@Injectable()
export class ResourceExistGuard implements CanActivate {
  constructor(
    @Inject(DatabaseProviderKey) readonly db: DBType,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const resources = this.reflector.get<
      {
        name?: string;
        table: MySqlTable;
        resourceIdColumn: MySqlColumn;
      }[]
    >(DecoratorKeys.resourceExistConfig, context.getHandler());

    for (const resource of resources) {
      const count = await this.db.$count(
        resource.table,
        eq(resource.resourceIdColumn, req.params.id),
      );

      if (count <= 0) {
        throw new NotFoundException(
          `${resource.name ?? 'Resource'} doesn't exist.`,
        );
      }
    }
    return true;
  }
}
