import { VisibilityTypes } from '@/common/utils/types';
import { int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';

export const timestamps = {
  dateCreated: (name?: string) =>
    timestamp(name ?? 'date_created', { fsp: 0 })
      .notNull()
      .defaultNow(),
  dateUpdated: (name?: string) =>
    timestamp(name ?? 'date_updated', { fsp: 0 }).onUpdateNow(),
};

export const autoId = int().autoincrement().primaryKey();

export const visibility = mysqlEnum(VisibilityTypes)
  .notNull()
  .default(VisibilityTypes.public);

export const Tables = {
  user: 'user',
  otp: 'otp',
  profile: 'profile',
  follow: 'follow',
  post: 'post',
  reaction: 'reaction',
  media: 'media',
  group: 'group',
  groupMember: 'group_member',
  tag: 'tag',
  thread: 'thread',
  threadFollow: 'thread_follow',
  notification: 'notification',
  chatChannel: 'chat_channel',
  chatMessage: 'chat_message',
  channelLastSeen: 'channel_last_seen',
} as const;
