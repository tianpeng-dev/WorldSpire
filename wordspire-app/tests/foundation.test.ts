import test from "node:test";
import assert from "node:assert/strict";
import { parseEnv } from "../src/lib/config/env";
import { cleanMessage } from "../src/lib/http/logger";
import { applyServerItems, enqueueSync, getLocalDB, markSynced } from "../src/store/local-db";

test("配置校验拒绝缺失配置，错误信息隐藏连接凭据", () => {
  const password = "private-password-that-must-not-appear";
  assert.throws(() => parseEnv({ POSTGRES_URL: `mysql://user:${password}@localhost/db` }), error =>
    error instanceof Error && error.message.includes("BETTER_AUTH_SECRET") && !error.message.includes(password));
  const valid = parseEnv({ POSTGRES_URL: "postgresql://localhost/wordspire", BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "test-secret-with-more-than-32-characters", CRON_SECRET: "test-cron-with-more-than-32-characters", LLM_BASE_URL: "" });
  assert.equal(valid.DATABASE_POOL_MAX, 5);
  assert.equal(valid.LLM_BASE_URL, undefined);
});
test("错误日志隐藏数据库地址、Bearer 凭据和 SQL 参数", () => {
  const cleaned = cleanMessage("failed postgres://user:private@localhost/database Bearer private-token\nparams: session-private-token");
  assert.equal(cleaned.includes("private"), false);
});
test("本地队列按队列项目标识确认，保留相同实体的其他版本", async () => {
  const deviceId = crypto.randomUUID();
  const base = { childProfileId: "queue-test-child", deviceId, entity: "attempts", entityId: "same-entity", op: "insert" as const, status: "local_dirty" as const };
  await enqueueSync({ ...base, version: 1 }); await enqueueSync({ ...base, version: 2 });
  const first = (await getLocalDB()).syncQueue.find(item => item.version === 1 && item.deviceId === deviceId)!;
  await markSynced([first.id]);
  const queue = (await getLocalDB()).syncQueue.filter(item => item.deviceId === deviceId);
  assert.equal(queue.find(item => item.version === 1)?.status, "synced");
  assert.equal(queue.find(item => item.version === 2)?.status, "local_dirty");
});

test("下行数据缺少业务字段时立即报错，不创建缺少依据的本地会话", async () => {
  await assert.rejects(applyServerItems([{ id: "invalid-downlink", childProfileId: "queue-test-child", entity: "sessions", entityId: "invalid-session",
    op: "insert", version: 1, cursor: 1, deviceId: "server", status: "synced", createdAt: Date.now(), payload: {} }]));
  assert.equal((await getLocalDB()).sessions.some(session => session.id === "invalid-session"), false);
});
