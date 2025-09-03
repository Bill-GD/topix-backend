import { NotificationActions } from '@/common/utils/types';
import { userTable } from '@/database/schemas/user.schema';
import { timestamps, Tables } from '@/database/utils';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { mysqlEnum } from 'drizzle-orm/mysql-core/columns/enum';

export const notificationTable = mysqlTable(Tables.notification, {
  id: varchar({ length: 255 }).primaryKey(), // <receiverId>:<actionType>:<objectId>
  receiverId: int('receiver_id').references(() => userTable.id, {
    onDelete: 'cascade',
  }),
  actorId: int('actor_id').references(() => userTable.id, {
    onDelete: 'cascade',
  }),
  actorCount: int('actor_count').notNull().default(1),
  actionType: mysqlEnum('action_type', NotificationActions).notNull(),
  objectId: int('object_id').notNull(),
  dateCreated: timestamps.dateCreated(),
});
