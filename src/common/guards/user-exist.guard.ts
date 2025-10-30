import { DecoratorKeys } from '@/common/decorators';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class UserExistGuard implements CanActivate {
  constructor(
    @Inject(DatabaseProviderKey) readonly db: DBType,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const check = this.reflector.get<'id' | 'username'>(
      DecoratorKeys.userExistCheck,
      context.getHandler(),
    );
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
