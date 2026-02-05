import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization function
function createDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

// Create database instance - will throw if DATABASE_URL is not set at runtime
// This is fine for build as Next.js will handle it
let dbInstance: ReturnType<typeof createDatabase> | null = null;

export const db = (() => {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
})();

// Export schema for use in migrations
export { schema };

// Export database type
export type Database = ReturnType<typeof createDatabase>;
