import {
  autoId,
  timestamps,
  visibility,
} from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import { userTable } from '@/database/schemas/user.schema';
import {
  boolean,
  int,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';

export const groupTable = mysqlTable(Tables.group, {
  id: autoId,
  ownerId: int()
    .notNull()
    .references(() => userTable.id),
  name: varchar({ length: 255 }).notNull(),
  bannerPicture: text(),
  description: text(),
  memberCount: int().notNull().default(0),
  visibility,
  ...timestamps,
});

export const groupMemberTable = mysqlTable(
  Tables.groupMember,
  {
    groupId: int()
      .notNull()
      .references(() => groupTable.id, { onDelete: 'cascade' }),
    userId: int()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    accepted: boolean().notNull().default(false),
    dateJoined: timestamps.dateCreated,
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);
