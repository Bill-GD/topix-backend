import { groupTable } from '@/database/schemas/group.schema';
import { tagTable } from '@/database/schemas/tag.schema';
import { userTable } from '@/database/schemas/user.schema';
import { autoId, timestamps, visibility, Tables } from '@/database/utils';
import { int, mysqlTable, primaryKey, varchar } from 'drizzle-orm/mysql-core';

export const threadTable = mysqlTable(Tables.thread, {
  id: autoId,
  ownerId: int('owner_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  groupId: int('group_id').references(() => groupTable.id, {
    onDelete: 'cascade',
  }),
  tagId: int('tag_id').references(() => tagTable.id, { onDelete: 'set null' }),
  title: varchar({ length: 255 }).notNull(),
  postCount: int('post_count').notNull().default(0),
  visibility,
  dateCreated: timestamps.dateCreated(),
  dateUpdated: timestamps.dateUpdated(),
});

export const threadFollowTable = mysqlTable(
  Tables.threadFollow,
  {
    userId: int('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    threadId: int('thread_id')
      .notNull()
      .references(() => threadTable.id, { onDelete: 'cascade' }),
    dateFollowed: timestamps.dateCreated('date_followed'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.threadId] })],
);
