import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Inject,
  mixin,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { eq } from 'drizzle-orm';

export function UserExistGuard(...checks: ('username' | 'email')[]) {
  class UserExistMixin implements CanActivate {
    constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      const dto = plainToInstance(RegisterDto, req.body);

      if (checks.includes('email')) {
        const res = await this.db.$count(
          userTable,
          eq(userTable.email, dto.email),
        );
        if (res >= 1) {
          throw new ConflictException('Email already taken.');
        }
      }

      if (checks.includes('username')) {
        const res = await this.db.$count(
          userTable,
          eq(userTable.username, dto.username),
        );
        if (res >= 1) {
          throw new ConflictException('Username already taken.');
        }
      }

      return true;
    }
  }

  return mixin(UserExistMixin);
}
