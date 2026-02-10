import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

function createDatabase(): DbInstance {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Add it in Vercel Project Settings → Environment Variables.');
  }
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  return drizzle(client, { schema });
}

let dbInstance: DbInstance | null = null;

function getDb(): DbInstance {
  if (!dbInstance) dbInstance = createDatabase();
  return dbInstance;
}

// When DATABASE_URL is unset, export a proxy so the module loads without throwing.
// This allows Vercel build to succeed before env vars are configured.
// The proxy throws when db is actually used at runtime.
export const db = process.env.DATABASE_URL
  ? getDb()
  : (new Proxy({} as DbInstance, {
      get() {
        throw new Error('DATABASE_URL is not set. Add it in Vercel Project Settings → Environment Variables.');
      }
    }) as DbInstance);

// Export schema for use in migrations
export { schema };

export type Database = DbInstance;
