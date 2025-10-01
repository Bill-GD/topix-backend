import { MediaTypes, Reactions } from '@/common/utils/types';
import { groupTable } from '@/database/schemas/group.schema';
import { tagTable } from '@/database/schemas/tag.schema';
import { threadTable } from '@/database/schemas/thread.schema';
import { userTable } from '@/database/schemas/user.schema';
import { autoId, Tables, timestamps, visibility } from '@/database/utils';
import {
  boolean,
  foreignKey,
  int,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';
import { mysqlEnum } from 'drizzle-orm/mysql-core/columns/enum';

export const postTable = mysqlTable(
  Tables.post,
  {
    id: autoId,
    ownerId: int('owner_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    parentPostId: int('parent_post_id'),
    threadId: int('thread_id').references(() => threadTable.id, {
      onDelete: 'cascade',
    }),
    groupId: int('group_id').references(() => groupTable.id, {
      onDelete: 'cascade',
    }),
    tagId: int('tag_id').references(() => tagTable.id, {
      onDelete: 'set null',
    }),
    content: text().notNull(),
    groupApproved: boolean('group_approved').notNull().default(false),
    visibility,
    dateCreated: timestamps.dateCreated(),
    dateUpdated: timestamps.dateUpdated(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentPostId],
      foreignColumns: [t.id],
    }).onDelete('cascade'),
  ],
);

export const reactionTable = mysqlTable(
  Tables.reaction,
  {
    userId: int('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    postId: int('post_id')
      .notNull()
      .references(() => postTable.id, { onDelete: 'cascade' }),
    type: mysqlEnum(Reactions).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const mediaTable = mysqlTable(Tables.media, {
  id: varchar({ length: 255 }).primaryKey(), // cloudinary public_id
  postId: int('post_id')
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  type: mysqlEnum(MediaTypes).notNull(),
  path: text().notNull(),
});

export const postStatsTable = mysqlTable(Tables.postStats, {
  id: autoId,
  postId: int('post_id')
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  replyCount: int('reply_count').notNull().default(0),
});
