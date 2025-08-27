import { userTable } from '@/database/schemas/user.schema';
import { timestamps } from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { mysqlEnum } from 'drizzle-orm/mysql-core/columns/enum';

export const notificationTable = mysqlTable(Tables.notification, {
  id: varchar({ length: 255 }), // <receiverId>:<actionType>:<objectId>
  receiverId: int().references(() => userTable.id, { onDelete: 'cascade' }),
  actorId: int().references(() => userTable.id, { onDelete: 'cascade' }),
  actorCount: int().notNull().default(1),
  actionType: mysqlEnum(['']).notNull().default(''),
  objectId: int().notNull(),
  dateCreated: timestamps.dateCreated,
});
