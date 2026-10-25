import { pool } from "@/lib/db";
import { logger } from "@/lib/http/logger";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    await pool.query("select 1");
    return Response.json({ status: "ready" }, { headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error({ err: error, requestId }, "数据库就绪检查失败");
    return Response.json({ status: "unavailable", error: "DATABASE_UNAVAILABLE", requestId }, { status: 503, headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } });
  }
}
