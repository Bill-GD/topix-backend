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
  ownerId: int()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  parentPostId: int(),
  threadId: int().references(() => threadTable.id, { onDelete: 'cascade' }),
  groupId: int().references(() => groupTable.id, { onDelete: 'cascade' }),
  tagId: int().references(() => tagTable.id, { onDelete: 'set null' }),
  content: text().notNull(),
  inGroupQueue: boolean().notNull().default(false),
  visibility,
  ...timestamps,
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
    userId: int()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    postId: int()
      .notNull()
      .references(() => postTable.id, { onDelete: 'cascade' }),
    type: mysqlEnum(['']).notNull().default(''),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const mediaTable = mysqlTable(Tables.media, {
  id: autoId,
  postId: int()
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  type: mysqlEnum(['']).notNull().default(''),
  path: text().notNull(),
});

export const mediaTempTable = mysqlTable(Tables.mediaTemp, {
  id: autoId,
  userId: int()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  type: mysqlEnum(['']).notNull().default(''),
  path: text().notNull(),
});

export const postStatsTable = mysqlTable(Tables.postStats, {
  id: autoId,
  postId: int()
    .notNull()
    .references(() => postTable.id, { onDelete: 'cascade' }),
  reactionCount: int().notNull().default(0),
  replyCount: int().notNull().default(0),
});
