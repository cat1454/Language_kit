import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/src/db/schema";

type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  languageKitPool?: Pool;
  languageKitDb?: Database;
};

export function getDb(): Database {
  if (globalForDb.languageKitDb) {
    return globalForDb.languageKitDb;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database operations.");
  }

  const pool =
    globalForDb.languageKitPool ??
    new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });

  globalForDb.languageKitPool = pool;
  globalForDb.languageKitDb = drizzle(pool, { schema });

  return globalForDb.languageKitDb;
}
