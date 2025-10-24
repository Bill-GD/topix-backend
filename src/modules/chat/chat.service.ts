import { ChatQuery, MessageQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  channelLastSeenTable,
  chatChannelTable,
  chatMessageTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { and, desc, eq, gt, like, lt, not, or, sql, SQL } from 'drizzle-orm';
import { MySqlColumn, SubqueryWithSelection } from 'drizzle-orm/mysql-core';
import { ChatMessageDto } from './dto/chat-message.dto';
import { CreateChatChannelDto } from './dto/create-chat-channel.dto';

type ChatChannelUser = {
  id: MySqlColumn<{
    name: 'id';
    tableName: 'user';
    dataType: 'number';
    columnType: 'MySqlInt';
    data: number;
    driverParam: string | number;
    notNull: true;
    hasDefault: true;
    isPrimaryKey: true;
    isAutoincrement: true;
    hasRuntimeDefault: false;
    enumValues: undefined;
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }>;
  username: MySqlColumn<{
    name: 'username';
    tableName: 'user';
    dataType: 'string';
    columnType: 'MySqlVarChar';
    data: string;
    driverParam: string | number;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }>;
  displayName: MySqlColumn<{
    name: 'display_name';
    tableName: 'profile';
    dataType: 'string';
    columnType: 'MySqlVarChar';
    data: string;
    driverParam: string | number;
    notNull: true;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }>;
  profilePicture: MySqlColumn<{
    name: 'profile_picture';
    tableName: 'profile';
    dataType: 'string';
    columnType: 'MySqlText';
    data: string;
    driverParam: string;
    notNull: false;
    hasDefault: false;
    isPrimaryKey: false;
    isAutoincrement: false;
    hasRuntimeDefault: false;
    enumValues: [string, ...string[]];
    baseColumn: never;
    identity: undefined;
    generated: undefined;
  }>;
};

@Injectable()
export class ChatService implements OnModuleInit {
  private firstUser: SubqueryWithSelection<ChatChannelUser, 'first_user'>;
  private secondUser: SubqueryWithSelection<ChatChannelUser, 'second_user'>;

  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  onModuleInit() {
    this.firstUser = this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
      })
      .from(userTable)
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .as('first_user');
    this.secondUser = this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
      })
      .from(userTable)
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .as('second_user');
  }

  async createChannel(dto: CreateChatChannelDto, requesterId: number) {
    const [{ id }] = await this.db
      .insert(chatChannelTable)
      .values({
        firstUser: requesterId,
        secondUser: dto.targetId,
      })
      .$returningId();

    await this.db.insert(channelLastSeenTable).values([
      {
        channelId: id,
        userId: dto.targetId,
      },
      {
        channelId: id,
        userId: requesterId,
      },
    ]);
    return Result.ok('Created new chat channel', id);
  }

  async getAll(chatQuery: ChatQuery, requesterId: number) {
    const lastMessage = this.db
      .select({
        channelId: chatMessageTable.channelId,
        content: chatMessageTable.content,
        sentAt: chatMessageTable.sentAt,
      })
      .from(chatMessageTable)
      .orderBy(desc(chatMessageTable.sentAt))
      .limit(1)
      .as('last_message');

    const getLastSeen = this.db
        .select({
          channelId: channelLastSeenTable.channelId,
          lastSeenAt: channelLastSeenTable.lastSeenAt,
        })
        .from(channelLastSeenTable)
        .where(eq(channelLastSeenTable.userId, requesterId))
        .as('ls'),
      newMessageCount = this.db
        .select({
          channelId: chatMessageTable.channelId,
          count: sql<number>`(count(1))`.as('count'),
        })
        .from(chatMessageTable)
        .innerJoin(
          getLastSeen,
          eq(getLastSeen.channelId, chatMessageTable.channelId),
        )
        .where(
          and(
            gt(chatMessageTable.sentAt, getLastSeen.lastSeenAt),
            not(eq(chatMessageTable.userId, requesterId)),
          ),
        )
        .groupBy(chatMessageTable.channelId)
        .as('mc');

    const andQueries: SQL[] = [];
    if (chatQuery.username) {
      andQueries.push(
        <SQL<unknown>>(
          or(
            like(this.firstUser.displayName, `%${chatQuery.username}%`),
            like(this.secondUser.displayName, `%${chatQuery.username}%`),
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
          id: this.firstUser.id,
          username: this.firstUser.username,
          displayName: this.firstUser.displayName,
          profilePicture: this.firstUser.profilePicture,
        },
        secondUser: {
          id: this.secondUser.id,
          username: this.secondUser.username,
          displayName: this.secondUser.displayName,
          profilePicture: this.secondUser.profilePicture,
        },
        lastMessage: lastMessage.content,
        lastSentAt: lastMessage.sentAt,
        newMessageCount: sql<number>`(ifnull(${newMessageCount.count}, 0))`,
        dateCreated: chatChannelTable.dateCreated,
      })
      .from(chatChannelTable)
      .leftJoin(
        newMessageCount,
        eq(newMessageCount.channelId, chatChannelTable.id),
      )
      .leftJoin(
        this.firstUser,
        eq(this.firstUser.id, chatChannelTable.firstUser),
      )
      .leftJoin(
        this.secondUser,
        eq(this.secondUser.id, chatChannelTable.secondUser),
      )
      .leftJoin(lastMessage, eq(lastMessage.channelId, chatChannelTable.id))
      .where(and(...andQueries))
      .orderBy(desc(chatChannelTable.dateCreated), desc(lastMessage.sentAt))
      .limit(chatQuery.limit)
      .offset(chatQuery.offset);
    return Result.ok(`Fetched chat channel successfully`, res);
  }

  async getChannel(channelId: number) {
    const res = await this.db
      .select({
        id: chatChannelTable.id,
        firstUser: {
          id: this.firstUser.id,
          username: this.firstUser.username,
          displayName: this.firstUser.displayName,
          profilePicture: this.firstUser.profilePicture,
        },
        secondUser: {
          id: this.secondUser.id,
          username: this.secondUser.username,
          displayName: this.secondUser.displayName,
          profilePicture: this.secondUser.profilePicture,
        },
      })
      .from(chatChannelTable)
      .leftJoin(
        this.firstUser,
        eq(this.firstUser.id, chatChannelTable.firstUser),
      )
      .leftJoin(
        this.secondUser,
        eq(this.secondUser.id, chatChannelTable.secondUser),
      )
      .where(eq(chatChannelTable.id, channelId))
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
      .leftJoin(userTable, eq(userTable.id, chatMessageTable.userId))
      .leftJoin(profileTable, eq(profileTable.userId, userTable.id))
      .where(
        and(
          eq(chatMessageTable.channelId, channelId),
          lt(chatMessageTable.sentAt, new Date(messageQuery.timestamp)),
        ),
      )
      .orderBy(desc(chatMessageTable.sentAt))
      .limit(messageQuery.size);
    return Result.ok(`Fetched chat messages successfully`, res);
  }

  async updateLastSeen(channelId: number, userId: number) {
    await this.db
      .update(channelLastSeenTable)
      .set({ lastSeenAt: sql`(now())` })
      .where(
        and(
          eq(channelLastSeenTable.channelId, channelId),
          eq(channelLastSeenTable.userId, userId),
        ),
      );
  }

  async remove(messageId: number) {
    await this.db
      .delete(chatMessageTable)
      .where(eq(chatMessageTable.id, messageId));
  }

  async removeChannel(channelId: number) {
    await this.db
      .delete(chatChannelTable)
      .where(eq(chatChannelTable.id, channelId));
    return Result.ok(`Deleted chat channel successfully`, null);
  }
}
