import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { chatChannelTable } from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CreateChatChannelDto } from './dto/create-chat-channel.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async createChannel(dto: CreateChatChannelDto, requesterId: number) {
    const [{ id }] = await this.db
      .insert(chatChannelTable)
      .values({
        firstUser: requesterId,
        secondUser: dto.targetId,
      })
      .$returningId();
    return Result.ok('This action adds a new chat', id);
  }

  getAll() {
    return `This action returns all chat`;
  }

  async getChannel(channelId: number) {
    const res = await this.db
      .select()
      .from(chatChannelTable)
      .where(eq(chatChannelTable.id, channelId))
      // join more to get both users
      .limit(1);

    if (res.length !== 1) return Result.fail('Channel not found');

    return Result.ok(`Fetched chat channel successfully`, res[0]);
  }

  sendChat(dto: CreateChatChannelDto) {
    return 'This action adds a new chat';
  }

  update(id: number, dto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
