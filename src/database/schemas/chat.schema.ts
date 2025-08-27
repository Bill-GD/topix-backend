import { userTable } from '@/database/schemas/user.schema';
import { autoId, timestamps } from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
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
    firstUser: int().references(() => userTable.id, { onDelete: 'set null' }),
    secondUser: int().references(() => userTable.id, { onDelete: 'set null' }),
  },
  (t) => [unique().on(t.firstUser, t.secondUser)],
);

export const chatMessageTable = mysqlTable(
  Tables.chatMessage,
  {
    channelId: int().references(() => chatChannelTable.id, {
      onDelete: 'cascade',
    }),
    userId: int().references(() => userTable.id, { onDelete: 'set null' }),
    content: text().notNull(),
    sentAt: timestamps.dateCreated,
  },
  (t) => [primaryKey({ columns: [t.channelId, t.userId] })],
);

export const channelLastSeenTable = mysqlTable(
  Tables.channelLastSeen,
  {
    channelId: int().references(() => chatChannelTable.id, {
      onDelete: 'cascade',
    }),
    userId: int().references(() => userTable.id, { onDelete: 'cascade' }),
    lastSeenAt: timestamps.dateCreated,
  },
  (t) => [primaryKey({ columns: [t.channelId, t.userId] })],
);
