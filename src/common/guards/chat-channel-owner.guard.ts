import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { chatChannelTable } from '@/database/schemas';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class ChatChannelOwnerGuard implements CanActivate {
  constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.userId) {
      throw new BadRequestException('No user ID found in request');
    }

    const channelId = req.params.id;

    const count = await this.db.$count(
      chatChannelTable,
      and(
        eq(chatChannelTable.id, Number(channelId)),
        or(
          eq(chatChannelTable.firstUser, req.userId),
          eq(chatChannelTable.secondUser, req.userId),
        ),
      ),
    );

    if (count <= 0) {
      throw new ForbiddenException(`User do not own the channel.`);
    }
    return true;
  }
}
