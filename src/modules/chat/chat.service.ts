import { ChatQuery, MessageQuery } from '@/common/queries';
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
import { and, desc, eq, like, or, SQL } from 'drizzle-orm';
import { ChatMessageDto } from './dto/chat-message.dto';
import { CreateChatChannelDto } from './dto/create-chat-channel.dto';

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

    const andQueries: SQL[] = [];
    if (chatQuery.username) {
      andQueries.push(
        <SQL<unknown>>(
          or(
            like(firstUser.displayName, `%${chatQuery.username}%`),
            like(secondUser.displayName, `%${chatQuery.username}%`),
          )
        ),
      );
    }

    andQueries.push(
      <SQL<unknown>>(
        or(
          eq(chatChannelTable.firstUser, requesterId),
          eq(chatChannelTable.secondUser, requesterId),
        )
      ),
    );

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
      .where(and(...andQueries))
      .orderBy(desc(chatChannelTable.dateCreated), desc(lastMessage.sentAt))
      .limit(chatQuery.limit)
      .offset(chatQuery.offset);
    return Result.ok(`Fetched chat channel successfully`, res);
  }

  async getChannel(channelId: number) {
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
        .as('second_user');

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
      })
      .from(chatChannelTable)
      .leftJoin(firstUser, eq(firstUser.id, chatChannelTable.firstUser))
      .leftJoin(secondUser, eq(secondUser.id, chatChannelTable.secondUser))
      .where(eq(chatChannelTable.id, channelId))
      // join more to get both users
      .limit(1);

    if (res.length !== 1) return Result.fail('Channel not found');

    return Result.ok(`Fetched chat channel successfully`, res[0]);
  }

  async addMessage(dto: ChatMessageDto, requesterId: number) {
    const [{ id }] = await this.db
      .insert(chatMessageTable)
      .values({
        channelId: dto.channelId,
        userId: requesterId,
        content: dto.content,
      })
      .$returningId();

    const [message] = await this.db
      .select({
        id: chatMessageTable.id,
        sender: {
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        content: chatMessageTable.content,
        sentAt: chatMessageTable.sentAt,
      })
      .from(chatMessageTable)
      .innerJoin(userTable, eq(userTable.id, chatMessageTable.userId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .where(eq(chatMessageTable.id, id));
    return Result.ok(`Sent message successfully`, message);
  }

  async getMessages(channelId: number, messageQuery: MessageQuery) {
    const res = await this.db
      .select({
        id: chatMessageTable.id,
        sender: {
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        content: chatMessageTable.content,
        sentAt: chatMessageTable.sentAt,
      })
      .from(chatMessageTable)
      .innerJoin(userTable, eq(userTable.id, chatMessageTable.userId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .where(eq(chatMessageTable.channelId, channelId))
      .orderBy(desc(chatMessageTable.sentAt))
      .limit(messageQuery.limit)
      .offset(messageQuery.offset);
    return Result.ok(`Fetched chat messages successfully`, res);
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
