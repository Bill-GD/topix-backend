import { autoId, timestamps } from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import {
  timestamp,
  int,
  mysqlTable,
  varchar,
  mysqlEnum,
  text,
  primaryKey,
} from 'drizzle-orm/mysql-core';

export const unverifiedUserTable = mysqlTable(Tables.unverifiedUser, {
  email: varchar({ length: 255 }).primaryKey(),
  otp: varchar({ length: 6 }).notNull(),
  expiresAt: timestamp({ mode: 'date', fsp: 0 })
    .notNull()
    .$default(() => new Date(Date.now() + 5 * 60000)),
});

export const userTable = mysqlTable(Tables.user, {
  id: autoId,
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 60 }).notNull(),
  role: mysqlEnum(['user', 'admin']).notNull().default('user'),
  ...timestamps,
});

export const profileTable = mysqlTable(Tables.profile, {
  id: autoId,
  userId: int()
    .notNull()
    .unique()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  displayName: varchar({ length: 255 }).notNull(),
  bio: text().notNull().default(''),
  profilePicture: text(),
  follower_count: int().notNull().default(0),
  following_count: int().notNull().default(0),
  dateUpdated: timestamps.dateUpdated,
});

export const followTable = mysqlTable(
  Tables.follow,
  {
    userId: int()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    followedId: int()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.followedId] })],
);
