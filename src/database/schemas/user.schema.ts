import { UserRoles } from '@/common/utils/types';
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
  expiresAt: timestamp('expires_at', { mode: 'date', fsp: 0 })
    .notNull()
    .$default(() => new Date(Date.now() + 5 * 60000)),
});

export const userTable = mysqlTable(Tables.user, {
  id: autoId,
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 60 }).notNull(),
  role: mysqlEnum(UserRoles).notNull().default(UserRoles.user),
  dateCreated: timestamps.dateCreated(),
  dateUpdated: timestamps.dateUpdated(),
});

export const profileTable = mysqlTable(Tables.profile, {
  id: autoId,
  userId: int('user_id')
    .notNull()
    .unique()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  bio: text().notNull().default(''),
  profilePicture: text('profile_picture'),
  followerCount: int('follower_count').notNull().default(0),
  followingCount: int('following_count').notNull().default(0),
  dateUpdated: timestamps.dateUpdated(),
});

export const followTable = mysqlTable(
  Tables.follow,
  {
    userId: int('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    followedId: int('followed_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.followedId] })],
);
