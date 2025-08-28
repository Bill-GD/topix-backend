import { MediaTypes, Reactions } from '@/common/utils/types';
import { groupTable } from '@/database/schemas/group.schema';
import { tagTable } from '@/database/schemas/tag.schema';
import { threadTable } from '@/database/schemas/thread.schema';
import { userTable } from '@/database/schemas/user.schema';
import {
  autoId,
  timestamps,
  visibility,
} from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import { relations } from 'drizzle-orm';
import {
  boolean,
  int,
  mysqlTable,
  primaryKey,
  text,
} from 'drizzle-orm/mysql-core';
import { mysqlEnum } from 'drizzle-orm/mysql-core/columns/enum';

export const postTable = mysqlTable(Tables.post, {
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
  tagId: int('tag_id').references(() => tagTable.id, { onDelete: 'set null' }),
  content: text().notNull(),
  inGroupQueue: boolean('in_group_queue').notNull().default(false),
  visibility,
  dateCreated: timestamps.dateCreated(),
  dateUpdated: timestamps.dateUpdated(),
});

export const postRelation = relations(postTable, ({ one }) => ({
  parentPost: one(postTable, {
    fields: [postTable.parentPostId],
    references: [postTable.id],
  }),
}));

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
  id: autoId,
  postId: int('post_id')
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  type: mysqlEnum(MediaTypes).notNull(),
  path: text().notNull(),
});

export const mediaTempTable = mysqlTable(Tables.mediaTemp, {
  id: autoId,
  userId: int('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  type: mysqlEnum(MediaTypes).notNull(),
  path: text().notNull(),
});

export const postStatsTable = mysqlTable(Tables.postStats, {
  id: autoId,
  postId: int('post_id')
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  reactionCount: int('reaction_count').notNull().default(0),
  replyCount: int('reply_count').notNull().default(0),
});
