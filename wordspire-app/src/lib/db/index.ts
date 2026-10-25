import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { getEnv } from "../config/env";
import * as schema from "./schema";
import { logger } from "../http/logger";
const settings = getEnv();
const shared = globalThis as typeof globalThis & { wordspirePool?: Pool };
export const pool = shared.wordspirePool ?? new Pool({
  connectionString: settings.POSTGRES_URL,
  max: settings.DATABASE_POOL_MAX,
  connectionTimeoutMillis: settings.DATABASE_CONNECT_TIMEOUT_MS,
  idleTimeoutMillis: settings.DATABASE_IDLE_TIMEOUT_MS,
  allowExitOnIdle: true,
  options: "-c timezone=UTC",
  statement_timeout: settings.DATABASE_STATEMENT_TIMEOUT_MS,
});
if (!shared.wordspirePool) pool.on("error", error => logger.error({ err: error }, "数据库空闲连接失败"));
if (process.env.NODE_ENV !== "production") shared.wordspirePool = pool;
if (process.env.VERCEL) attachDatabasePool(pool);
export const db = drizzle(pool, { schema });
export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DatabaseExecutor = Database | Transaction;
export { schema };
