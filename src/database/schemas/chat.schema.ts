import { userTable } from '@/database/schemas/user.schema';
import { autoId, Tables, timestamps } from '@/database/utils';
import {
  int,
  mysqlTable,
  primaryKey,
  text,
  unique,
} from 'drizzle-orm/mysql-core';

export const chatChannelTable = mysqlTable(
  Tables.chatChannel,
  {
    id: autoId,
    firstUser: int('first_user').references(() => userTable.id, {
      onDelete: 'set null',
    }),
    secondUser: int('second_user').references(() => userTable.id, {
      onDelete: 'set null',
    }),
    dateCreated: timestamps.dateCreated(),
  },
  (t) => [unique().on(t.firstUser, t.secondUser)],
);

export const chatMessageTable = mysqlTable(Tables.chatMessage, {
  id: autoId,
  channelId: int('channel_id')
    .notNull()
    .references(() => chatChannelTable.id, {
      onDelete: 'cascade',
    }),
  userId: int('user_id').references(() => userTable.id, {
    onDelete: 'set null',
  }),
  content: text().notNull(),
  sentAt: timestamps.dateCreated('sent_at'),
});

export const channelLastSeenTable = mysqlTable(
  Tables.channelLastSeen,
  {
    channelId: int('channel_id').references(() => chatChannelTable.id, {
      onDelete: 'cascade',
    }),
    userId: int('user_id').references(() => userTable.id, {
      onDelete: 'cascade',
    }),
    lastSeenAt: timestamps.dateCreated('last_seen_at'),
  },
  (t) => [primaryKey({ columns: [t.channelId, t.userId] })],
);
