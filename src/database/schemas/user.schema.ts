import { UserRoles } from '@/common/utils/types';
import { autoId, Tables, timestamps } from '@/database/utils';
import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const userTable = mysqlTable(Tables.user, {
  id: autoId,
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 60 }).notNull(),
  verified: boolean().notNull().default(false),
  role: mysqlEnum(UserRoles).notNull().default(UserRoles.user),
  notificationLastSeenAt: timestamps.dateCreated('notification_last_seen_at'),
  dateCreated: timestamps.dateCreated(),
  dateUpdated: timestamps.dateUpdated(),
});

export const otpTable = mysqlTable(Tables.otp, {
  id: autoId,
  userId: int('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  otp: varchar({ length: 8 }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date', fsp: 0 })
    .notNull()
    .$default(() => new Date(Date.now() + 300 * 1000)),
});

export const profileTable = mysqlTable(Tables.profile, {
  id: autoId,
  userId: int('user_id')
    .notNull()
    .unique()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text(),
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
