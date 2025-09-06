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
  mixin, NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { eq } from 'drizzle-orm';
import { Exception } from 'handlebars';

export function UserExistGuard(
  shouldExist: boolean,
  checks: ('username' | 'email')[],
) {
  class UserExistMixin implements CanActivate {
    constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      const handlerName = context.getHandler().name;

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

  return mixin(UserExistMixin);
}
