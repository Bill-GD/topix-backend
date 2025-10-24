import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { chatChannelTable } from '@/database/schemas';
import { CreateChatChannelDto } from '@/modules/chat/dto/create-chat-channel.dto';
import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { Request } from 'express';

@Injectable()
export class ChatChannelDuplicationGuard implements CanActivate {
  constructor(@Inject(DatabaseProviderKey) readonly db: DBType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const { targetId } = req.body as CreateChatChannelDto;

    if (!req.userId) {
      throw new BadRequestException('No user ID found in request');
    }

    const count = await this.db.$count(
      chatChannelTable,
      or(
        and(
          eq(chatChannelTable.firstUser, targetId),
          eq(chatChannelTable.secondUser, req.userId),
        ),
        and(
          eq(chatChannelTable.firstUser, req.userId),
          eq(chatChannelTable.secondUser, targetId),
        ),
      ),
    );

    if (count > 0) {
      throw new ConflictException(`Chat channel already exist.`);
    }
    return true;
  }
}
