import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class AccountOwnerGuard implements CanActivate {
  constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const [{ id: requestedUser, role }] = await this.db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.username, req.params.username));

    if (role !== 'admin' && req.userId !== requestedUser) {
      throw new ForbiddenException('User does not have access to this action.');
    }

    return true;
  }
}
