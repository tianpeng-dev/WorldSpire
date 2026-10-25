import { db, pool } from "../src/lib/db";
import { seedContent } from "../src/lib/content/service";
import { logger } from "../src/lib/http/logger";
try {
  await db.transaction(seedContent);
  console.log("课程内容初始化已完成。");
} catch (error) {
  logger.error({ err: error }, "课程初始化失败");
  process.exitCode = 1;
} finally { await pool.end(); }
