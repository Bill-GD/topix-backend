import { groupTable } from '@/database/schemas/group.schema';
import { autoId } from '@/database/utils/common-columns';
import { Tables } from '@/database/utils/tables';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const tagTable = mysqlTable(Tables.tag, {
  id: autoId,
  groupId: int('group_id')
    .notNull()
    .references(() => groupTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 20 }).notNull(),
  colorHex: varchar('color_hex', { length: 6 }).notNull(),
});
