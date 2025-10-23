import { ChatQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  chatChannelTable,
  chatMessageTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, or } from 'drizzle-orm';
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

  async getAll(chatQuery: ChatQuery, requesterId: number) {
    const firstUser = this.db
        .select({
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        })
        .from(userTable)
        .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
        .as('first_user'),
      secondUser = this.db
        .select({
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        })
        .from(userTable)
        .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
        .as('second_user'),
      lastMessage = this.db
        .select({
          channelId: chatMessageTable.channelId,
          content: chatMessageTable.content,
          sentAt: chatMessageTable.sentAt,
        })
        .from(chatMessageTable)
        .orderBy(desc(chatMessageTable.sentAt))
        .limit(1)
        .as('last_message');

    const res = await this.db
      .select({
        id: chatChannelTable.id,
        firstUser: {
          id: firstUser.id,
          username: firstUser.username,
          displayName: firstUser.displayName,
          profilePicture: firstUser.profilePicture,
        },
        secondUser: {
          id: secondUser.id,
          username: secondUser.username,
          displayName: secondUser.displayName,
          profilePicture: secondUser.profilePicture,
        },
        lastMessage: lastMessage.content,
        lastSentAt: lastMessage.sentAt,
        dateCreated: chatChannelTable.dateCreated,
      })
      .from(chatChannelTable)
      .leftJoin(firstUser, eq(firstUser.id, chatChannelTable.firstUser))
      .leftJoin(secondUser, eq(secondUser.id, chatChannelTable.secondUser))
      .leftJoin(lastMessage, eq(lastMessage.channelId, chatChannelTable.id))
      .where(
        or(
          eq(chatChannelTable.firstUser, requesterId),
          eq(chatChannelTable.secondUser, requesterId),
        ),
      )
      .orderBy(desc(chatChannelTable.dateCreated), desc(lastMessage.sentAt))
      .limit(chatQuery.limit)
      .offset(chatQuery.offset);
    return Result.ok(`Fetched chat channel successfully`, res);
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
