import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { postTable } from '@/database/schemas';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class PostExistGuard implements CanActivate {
  constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const count = await this.db.$count(
      postTable,
      eq(postTable.id, Number(req.params.id)),
    );

    if (count <= 0) {
      throw new NotFoundException(`Post doesn't exist.`);
    }
    return true;
  }
}
