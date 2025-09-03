import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export type DBType = MySql2Database<Record<string, unknown>> & {
  $client: mysql.Pool;
};

export const VisibilityTypes = {
  public: 'public',
  private: 'private',
  hidden: 'hidden',
} as const;

export const UserRoles = {
  user: 'user',
  admin: 'admin',
} as const;

export const MediaTypes = {
  image: 'image',
  video: 'video',
} as const;

export const Reactions = {
  like: 'like',
  love: 'love',
  laugh: 'laugh',
  sad: 'sad',
  angry: 'angry',
} as const;

export const NotificationActions = {
  react: 'react',
  updateThread: 'update_thread',
  follow: 'follow',
} as const;
