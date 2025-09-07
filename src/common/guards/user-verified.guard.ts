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
export class UserVerifiedGuard implements CanActivate {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const userId = Number(req.params.id);

    const [user] = await this.db
      .select({
        id: userTable.id,
        verified: userTable.verified,
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (user.verified) {
      throw new ForbiddenException('User is already verified.');
    }

    return true;
  }
}
