import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export type DBType = MySql2Database<Record<string, unknown>> & {
  $client: mysql.Pool;
};

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

export type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  asset_folder: string;
  display_name: string;
  original_filename: string;
  api_key: string;
};
