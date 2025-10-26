import { v2 } from 'cloudinary';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export type DBType = MySql2Database<Record<string, unknown>> & {
  $client: mysql.Pool;
};

export type Cloudinary = typeof v2;

export type JwtUserPayload = {
  sub: number;
  role: keyof typeof UserRoles;
  type: 'access' | 'refresh';
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
  heart: 'heart',
  laugh: 'laugh',
  sad: 'sad',
  angry: 'angry',
} as const;

export const NotificationActions = {
  react: 'react',
  updateThread: 'update_thread',
  follow: 'follow',
} as const;

export type NotificationTypes =
  (typeof NotificationActions)[keyof typeof NotificationActions];
