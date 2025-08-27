import { MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export type DBType = MySql2Database<Record<string, unknown>> & {
  $client: mysql.Pool;
};
