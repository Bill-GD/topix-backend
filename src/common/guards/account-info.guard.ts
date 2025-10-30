import { DecoratorKeys } from '@/common/decorators';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class AccountInfoGuard implements CanActivate {
  constructor(
    @Inject(DatabaseProviderKey) readonly db: DBType,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const handlerName = context.getHandler().name;
    const { shouldExist, checks } = this.reflector.get<{
      shouldExist: boolean;
      checks: ('email' | 'username')[];
    }>(DecoratorKeys.accountInfoConfig, context.getHandler());

    const dto = plainToInstance(
      handlerName === 'login' ? LoginDto : RegisterDto,
      req.body,
    );

    if (checks.includes('email')) {
      if (!(dto instanceof RegisterDto)) {
        throw new BadRequestException('DTO is invalid.');
      }

      const res = await this.db.$count(
        userTable,
        eq(userTable.email, dto.email),
      );
      if (!shouldExist && res >= 1) {
        throw new ConflictException('Email already taken.');
      }
      if (shouldExist && res <= 0) {
        throw new NotFoundException(`Email doesn't exist.`);
      }
    }

    if (checks.includes('username')) {
      const res = await this.db.$count(
        userTable,
        eq(userTable.username, dto.username),
      );
      if (!shouldExist && res >= 1) {
        throw new ConflictException('Username already taken.');
      }
      if (shouldExist && res <= 0) {
        throw new NotFoundException(`Username doesn't exist.`);
      }
    }

    return true;
  }
}
