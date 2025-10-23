import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import * as schema from '@/database/schemas';
import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseProviderKey,
      useFactory: async (): Promise<DBType> => {
        const poolConnection = mysql.createPool({
          host: String(process.env.DATABASE_HOST),
          user: String(process.env.DATABASE_USER),
          password: String(process.env.DATABASE_PASSWORD),
          database: String(process.env.DATABASE_NAME),
        });

        await poolConnection.query("SET time_zone = '+00:00'");

        return drizzle(poolConnection, {
          schema,
          casing: 'snake_case',
          mode: 'default',
          // logger: true,
        });
      },
    },
  ],
  exports: [DatabaseProviderKey],
})
export class DatabaseModule {}
