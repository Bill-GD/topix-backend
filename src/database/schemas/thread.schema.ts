import { groupTable } from '@/database/schemas/group.schema';
import { tagTable } from '@/database/schemas/tag.schema';
import { userTable } from '@/database/schemas/user.schema';
import {
  autoId,
  timestamps,
  visibility,
} from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import { int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

export const threadTable = mysqlTable(Tables.thread, {
  id: autoId,
  ownerId: int()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  groupId: int().references(() => groupTable.id, { onDelete: 'cascade' }),
  tagId: int().references(() => tagTable.id, { onDelete: 'set null' }),
  title: varchar({ length: 255 }),
  postCount: int().notNull().default(0),
  visibility,
  ...timestamps,
});

export const threadFollowTable = mysqlTable(
  Tables.threadFollow,
  {
    userId: int()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    threadId: int()
      .notNull()
      .references(() => threadTable.id, { onDelete: 'cascade' }),
    dateFollowed: timestamps.dateCreated,
  },
  (t) => [primaryKey({ columns: [t.userId, t.threadId] })],
);
