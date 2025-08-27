import { int, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';

export const timestamps = {
  dateCreated: timestamp({ mode: 'date', fsp: 0 }).defaultNow(),
  dateUpdated: timestamp({ mode: 'date', fsp: 0 }).onUpdateNow(),
};

export const autoId = int().autoincrement().primaryKey();

export const visibility = mysqlEnum(['']).notNull().default('');
