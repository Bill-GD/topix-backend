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
  ownerId: int('owner_id')
    .notNull()
    .references(() => userTable.id),
  name: varchar({ length: 255 }).notNull(),
  bannerPicture: text('banner_picture'),
  description: text(),
  memberCount: int('member_count').notNull().default(1),
  visibility,
  dateCreated: timestamps.dateCreated(),
  dateUpdated: timestamps.dateUpdated(),
});

export const groupMemberTable = mysqlTable(
  Tables.groupMember,
  {
    groupId: int('group_id')
      .notNull()
      .references(() => groupTable.id, { onDelete: 'cascade' }),
    userId: int('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    accepted: boolean().notNull().default(false),
    dateJoined: timestamps.dateCreated('date_joined'),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);
