import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: ['./src/database/schemas/**/*.schema.ts'],
  dialect: 'mysql',
  dbCredentials: {
    host: String(process.env.DATABASE_HOST),
    port: Number(process.env.DATABASE_PORT),
    user: String(process.env.DATABASE_USER),
    password: String(process.env.DATABASE_PASSWORD),
    database: String(process.env.DATABASE_NAME),
  },
  verbose: process.env.ENVIRONMENT === 'development',
});
