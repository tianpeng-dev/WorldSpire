import { pool } from "../src/lib/db";
import { migrateDatabase } from "../src/lib/db/migrations";
import { logger } from "../src/lib/http/logger";
try {
  await migrateDatabase(pool);
  console.log("数据库迁移已完成。");
} catch (error) {
  logger.error({ err: error }, "数据库迁移失败");
  process.exitCode = 1;
} finally { await pool.end(); }
