import { VisibilityTypes } from '@/common/utils/types';
import { int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';

export const timestamps = {
  dateCreated: (name?: string) =>
    timestamp(name ?? 'date_created', { mode: 'date', fsp: 0 }).defaultNow(),
  dateUpdated: (name?: string) =>
    timestamp(name ?? 'date_updated', { mode: 'date', fsp: 0 }).onUpdateNow(),
};

export const autoId = int().autoincrement().primaryKey();

export const visibility = mysqlEnum(VisibilityTypes)
  .notNull()
  .default(VisibilityTypes.public);
