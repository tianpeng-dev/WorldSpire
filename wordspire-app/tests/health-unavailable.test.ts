import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL!;
test("真实生产 HTTP：数据库不可连接时，进程存活检查保持成功，就绪检查返回 503", async () => {
  const live = await fetch(`${base}/api/health/live`);
  assert.equal(live.status, 200);
  assert.equal((await live.json()).status, "alive");
  const ready = await fetch(`${base}/api/health/ready`);
  assert.equal(ready.status, 503);
  const body = await ready.json();
  assert.equal(body.error, "DATABASE_UNAVAILABLE");
  assert.equal(body.requestId, ready.headers.get("x-request-id"));
});
test("真实生产 HTTP：数据库异常返回带请求标识的 500，响应隐藏连接凭据", async () => {
  const result = await fetch(`${base}/api/auth`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ action: "guest-signup" }) });
  assert.equal(result.status, 500);
  const body = await result.json();
  assert.equal(body.error, "INTERNAL");
  assert.equal(body.requestId, result.headers.get("x-request-id"));
  assert.equal(JSON.stringify(body).includes("postgres"), false);
});
