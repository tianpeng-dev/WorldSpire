import test, { after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import makeFetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/node-postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import SwaggerParser from "@apidevtools/swagger-parser";
import { migrateDatabase } from "../src/lib/db/migrations";
import { seedContent } from "../src/lib/content/service";
import { signSessionValue } from "../src/lib/auth/session-codec";
import { FRUIT_OPTIONS } from "../src/lib/child/seed";
import * as schema from "../src/lib/db/schema";

const base = process.env.TEST_BASE_URL!;
const db = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: "-c timezone=UTC" });
after(async () => { await db.end(); });
function client() {
  const jar = new CookieJar();
  const fetch = makeFetchCookie(globalThis.fetch, jar);
  const deviceId = randomUUID();
  return { jar, deviceId, async request(path: string, body?: unknown) {
    const response = await fetch(`${base}${path}`, { method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Origin: base, "X-WordSpire-Device-Id": deviceId }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.match(response.headers.get("content-type") ?? "", /application\/json/, `${path} 返回 ${response.status}，请检查 HTTP 服务日志。`);
    const data = await response.json();
    return { response, data };
  } };
}

const child = client();
const guardian = client();
const secondChild = client();
let childId: string;
let childUserId: string;
let guardianId: string;
let secondChildId: string;
let learningId: string;
let bindingId: string;
let battleId: string;
async function correctAnswer(sessionId: string) {
  const session = await db.query("select * from sessions where id = $1", [sessionId]);
  const questions = await db.query("select * from questions where stage_id = $1 order by id", [session.rows[0].stage_id]);
  const question = questions.rows[session.rows[0].current_index];
  return { questionId: question.id, optionId: FRUIT_OPTIONS.find(option => option.label === question.options[question.correct_index])!.id,
    latencyMs: 1000, idempotencyKey: `${sessionId}:${question.id}:test` };
}
function expectStatus(result: { response: Response; data: unknown }, status = 200) {
  assert.equal(result.response.status, status, JSON.stringify(result.data));
}

test("真实数据库：空库迁移、重复迁移和重复课程初始化", async () => {
  await migrateDatabase(db); await migrateDatabase(db);
  assert.equal(Number((await db.query("select count(*) from drizzle.__drizzle_migrations")).rows[0].count), readMigrationFiles({ migrationsFolder: "drizzle" }).length);
  const content = drizzle(db, { schema });
  await content.transaction(seedContent); await content.transaction(seedContent);
  assert.equal(Number((await db.query("select count(*) from courses")).rows[0].count), 1);
  assert.equal(Number((await db.query("select count(*) from stages")).rows[0].count), 4);
  assert.equal(Number((await db.query("select count(*) from questions")).rows[0].count), 9);
});

test("真实数据库：已有数据升级保留用户、档案、学习记录和同步变更", async () => {
  const legacy = new Pool({ connectionString: process.env.TEST_LEGACY_DATABASE_URL, options: "-c timezone=UTC" });
  try {
    await legacy.query(await readFile("drizzle/0000_wordspire_base.sql", "utf8"));
    await drizzle(legacy, { schema }).transaction(seedContent);
    await legacy.query("insert into users(id,role,nickname) values ('legacy-user','child','旧账号')");
    await legacy.query("insert into child_profiles(id,user_id,age,grade) values ('legacy-child','legacy-user',7,'一年级')");
    await legacy.query("insert into star_wallets(id,child_profile_id,balance,total_earned) values ('legacy-wallet','legacy-child',8,8)");
    await legacy.query("insert into sessions(id,child_profile_id,stage_id,started_at,current_index,total_questions) values ('legacy-session','legacy-child','stage-fruit-1',now(),1,3)");
    const question = (await legacy.query("select id from questions where stage_id = 'stage-fruit-1' order by id limit 1")).rows[0];
    await legacy.query("insert into attempts(id,session_id,question_id,child_profile_id,correct,latency_ms,answered_at) values ('legacy-attempt','legacy-session',$1,'legacy-child',true,1000,now())", [question.id]);
    await legacy.query("insert into sync_changes(id,child_profile_id,entity,entity_id,op,version,device_id,payload) values ('legacy-change','legacy-child','sessions','legacy-session','update',1700000000,'old-device','{}')");
    await legacy.query("drop index questions_target_word_idx");
    await legacy.query("create index questions_target_word_idx on questions(stage_id)");
    await assert.rejects(migrateDatabase(legacy), /索引不一致/);
    assert.equal((await legacy.query("select to_regclass('drizzle.__drizzle_migrations') as journal")).rows[0].journal, null);
    await legacy.query("drop index questions_target_word_idx");
    await legacy.query("create index questions_target_word_idx on questions(target_word)");
    await migrateDatabase(legacy); await migrateDatabase(legacy);
    assert.equal((await legacy.query("select role,email,is_anonymous from users where id='legacy-user'")).rows[0].is_anonymous, true);
    assert.equal((await legacy.query("select balance from star_wallets where id='legacy-wallet'")).rows[0].balance, 8);
    assert.equal((await legacy.query("select session_id from attempts where id='legacy-attempt'")).rows[0].session_id, "legacy-session");
    assert.match((await legacy.query("select friend_code from child_profiles where id='legacy-child'")).rows[0].friend_code, /^[A-Z0-9]{8}$/);
    assert.equal((await legacy.query("select sync_cursor from child_profiles where id='legacy-child'")).rows[0].sync_cursor, 1);
    assert.equal((await legacy.query("select cursor from sync_changes where id='legacy-change'")).rows[0].cursor, 1);
    const first = (await legacy.query("select id,hash from drizzle.__drizzle_migrations order by created_at limit 1")).rows[0];
    await legacy.query("update drizzle.__drizzle_migrations set hash = 'altered' where id = $1", [first.id]);
    await assert.rejects(migrateDatabase(legacy), /迁移登记/);
    await legacy.query("update drizzle.__drizzle_migrations set hash = $1 where id = $2", [first.hash, first.id]);
  } finally { await legacy.end(); }
});

test("真实 HTTP：游客建档、家长邮箱注册、退出与登录", async () => {
  const created = await child.request("/api/auth", { action: "guest-signup", age: 7, grade: "一年级", deviceId: child.deviceId });
  assert.equal(created.response.status, 200, JSON.stringify(created.data));
  assert.ok(created.data.childProfileId);
  childId = created.data.childProfileId; childUserId = created.data.userId;
  const repeated = await child.request("/api/auth", { action: "guest-signup", deviceId: child.deviceId });
  assert.equal(repeated.response.status, 200, JSON.stringify(repeated.data));
  assert.equal(repeated.data.childProfileId, created.data.childProfileId);
  const overview = await child.request("/api/child/overview");
  assert.equal(overview.response.status, 200, JSON.stringify(overview.data));
  const signup = await guardian.request("/api/auth/sign-up/email", { email: "guardian@example.com", password: "wordspire-real-test-password", name: "家长", role: "child" });
  assert.equal(signup.response.status, 200, JSON.stringify(signup.data));
  const session = await guardian.request("/api/auth/get-session");
  assert.equal(session.data.user.role, "guardian");
  guardianId = session.data.user.id;
  const logout = await makeFetchCookie(globalThis.fetch, guardian.jar)(`${base}/api/auth/sign-out`, { method: "POST", headers: { Origin: base } });
  assert.equal(logout.status, 200);
  assert.equal((await guardian.request("/api/parent/children")).response.status, 401);
  assert.equal((await guardian.request("/api/auth/sign-in/email", { email: "guardian@example.com", password: "wrong-password" })).response.status, 401);
  const login = await guardian.request("/api/auth/sign-in/email", { email: "guardian@example.com", password: "wordspire-real-test-password" });
  assert.equal(login.response.status, 200, JSON.stringify(login.data));
  const accounts = await db.query("select password from auth_accounts where user_id = $1", [session.data.user.id]);
  assert.ok(accounts.rows[0].password);
  assert.notEqual(accounts.rows[0].password, "wordspire-real-test-password");
});

test("真实 HTTP：并发重复建档保留原档案、钱包和进度", async () => {
  const results = await Promise.all(Array.from({ length: 4 }, () => child.request("/api/auth", { action: "guest-signup", deviceId: child.deviceId })));
  for (const result of results) { expectStatus(result); assert.equal(result.data.childProfileId, childId); }
  assert.equal(Number((await db.query("select count(*) from child_profiles where user_id=$1", [childUserId])).rows[0].count), 1);
  assert.equal(Number((await db.query("select count(*) from star_wallets where child_profile_id=$1", [childId])).rows[0].count), 1);
  assert.equal(Number((await db.query("select count(*) from stage_progress where child_profile_id=$1", [childId])).rows[0].count), 4);
  const code = await child.request("/api/child/friend-code"); expectStatus(code); assert.match(code.data.code, /^[A-Z0-9]{8}$/);
  assert.equal((await child.request("/api/collection")).data.collection.badges.every((badge: { unlocked: boolean }) => !badge.unlocked), true);
});

test("真实 HTTP：绑定申请、儿童确认、双方解除和跨儿童权限", async () => {
  const other = await secondChild.request("/api/auth", { action: "guest-signup", deviceId: secondChild.deviceId }); expectStatus(other);
  secondChildId = other.data.childProfileId;
  const code = (await child.request("/api/child/friend-code")).data.code;
  const requested = await guardian.request("/api/bindings", { code }); expectStatus(requested);
  bindingId = requested.data.binding.id;
  assert.equal(requested.data.binding.status, "pending");
  expectStatus(await guardian.request(`/api/report?childProfileId=${childId}`), 403);
  expectStatus(await guardian.request(`/api/bindings/${bindingId}`, { action: "confirm" }), 403);
  expectStatus(await secondChild.request(`/api/bindings/${bindingId}`, { action: "confirm" }), 403);
  expectStatus(await child.request(`/api/bindings/${bindingId}`, { action: "confirm" }));
  expectStatus(await guardian.request(`/api/report?childProfileId=${childId}`));
  expectStatus(await secondChild.request(`/api/report?childProfileId=${childId}`), 403);
  expectStatus(await guardian.request(`/api/report?childProfileId=${secondChildId}`), 403);
  assert.equal((await guardian.request("/api/parent/children")).data.items[0].id, childId);
  expectStatus(await guardian.request(`/api/bindings/${bindingId}`, { action: "revoke" }));
  expectStatus(await guardian.request(`/api/report?childProfileId=${childId}`), 403);
  expectStatus(await child.request(`/api/bindings/${bindingId}`, { action: "confirm" }), 409);
  expectStatus(await guardian.request("/api/bindings", { code }));
  expectStatus(await child.request(`/api/bindings/${bindingId}`, { action: "confirm" }));
  expectStatus(await child.request(`/api/bindings/${bindingId}`, { action: "revoke" }));
  expectStatus(await guardian.request(`/api/child/overview?childProfileId=${childId}`), 403);
  expectStatus(await guardian.request("/api/bindings", { code }));
  expectStatus(await child.request(`/api/bindings/${bindingId}`, { action: "confirm" }));
  assert.equal(Number((await db.query("select count(*) from guardian_links where guardian_user_id=$1 and child_profile_id=$2", [guardianId, childId])).rows[0].count), 1);
});

test("真实 HTTP：角色检查、主力设备写入限制和页面权限", async () => {
  expectStatus(await guardian.request("/api/learning/sessions", { stageId: "stage-fruit-1" }), 403);
  const clone = client();
  for (const cookie of await child.jar.getCookies(base)) await clone.jar.setCookie(cookie.toString(), base);
  expectStatus(await clone.request("/api/child/overview"));
  expectStatus(await clone.request("/api/learning/sessions", { stageId: "stage-fruit-1" }), 403);
  expectStatus(await clone.request("/api/sync", { childProfileId: childId, deviceId: clone.deviceId, items: [], lastSyncVersion: 0 }), 403);
  const forged = await fetch(`${base}/api/child/overview`, { headers: { Cookie: "wordspire.session_token=forged", "x-wordspire-public-page": "1" } });
  assert.equal(forged.status, 401);
  const page = await makeFetchCookie(globalThis.fetch, guardian.jar)(`${base}/child`, { redirect: "manual", headers: { "x-wordspire-public-page": "1" } });
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location") ?? "", /voice-guide/);
});

test("真实 HTTP：建档失败时账号、档案与会话全部恢复到请求前状态", async () => {
  const before = (await db.query("select (select count(*) from users) as users, (select count(*) from auth_sessions) as sessions")).rows[0];
  await db.query("create function test_fail_profile() returns trigger language plpgsql as $$ begin raise exception 'test profile transaction failure'; end $$");
  await db.query("create trigger test_fail_profile before insert on child_profiles for each row execute function test_fail_profile()");
  try { expectStatus(await client().request("/api/auth", { action: "guest-signup" }), 500); }
  finally { await db.query("drop trigger test_fail_profile on child_profiles"); await db.query("drop function test_fail_profile()"); }
  const after = (await db.query("select (select count(*) from users) as users, (select count(*) from auth_sessions) as sessions")).rows[0];
  assert.deepEqual(after, before);
});

test("真实 HTTP：学习写入失败恢复、并发答题幂等和通关结算", async () => {
  const starts = await Promise.all(Array.from({ length: 3 }, () => child.request("/api/learning/sessions", { stageId: "stage-fruit-1" })));
  starts.forEach(result => expectStatus(result, 201));
  learningId = starts[0].data.session.id;
  assert.equal(new Set(starts.map(result => result.data.session.id)).size, 1);
  expectStatus(await secondChild.request(`/api/learning/sessions/${learningId}`), 404);
  const first = await correctAnswer(learningId);
  const cursor = (await db.query("select sync_cursor from child_profiles where id=$1", [childId])).rows[0].sync_cursor;
  await db.query("create function test_fail_wallet() returns trigger language plpgsql as $$ begin raise exception 'test wallet transaction failure'; end $$");
  await db.query("create trigger test_fail_wallet before update on star_wallets for each row execute function test_fail_wallet()");
  try { expectStatus(await child.request(`/api/learning/sessions/${learningId}/attempts`, first), 500); }
  finally { await db.query("drop trigger test_fail_wallet on star_wallets"); await db.query("drop function test_fail_wallet()"); }
  assert.equal(Number((await db.query("select count(*) from attempts where session_id=$1", [learningId])).rows[0].count), 0);
  assert.equal((await db.query("select sync_cursor from child_profiles where id=$1", [childId])).rows[0].sync_cursor, cursor);
  assert.equal((await db.query("select balance from star_wallets where child_profile_id=$1", [childId])).rows[0].balance, 0);
  const answers = await Promise.all(Array.from({ length: 5 }, () => child.request(`/api/learning/sessions/${learningId}/attempts`, first)));
  answers.forEach(result => expectStatus(result));
  assert.equal(Number((await db.query("select count(*) from attempts where session_id=$1", [learningId])).rows[0].count), 1);
  assert.equal((await db.query("select balance from star_wallets where child_profile_id=$1", [childId])).rows[0].balance, 1);
  expectStatus(await child.request(`/api/learning/sessions/${learningId}/attempts`, { ...first, latencyMs: 2000 }), 409);
  expectStatus(await child.request(`/api/learning/sessions/${learningId}/complete`, {}), 409);
  while ((await db.query("select current_index < total_questions as pending from sessions where id=$1", [learningId])).rows[0].pending) {
    expectStatus(await child.request(`/api/learning/sessions/${learningId}/attempts`, await correctAnswer(learningId)));
  }
  const completions = await Promise.all(Array.from({ length: 4 }, () => child.request(`/api/learning/sessions/${learningId}/complete`, {})));
  completions.forEach(result => expectStatus(result));
  assert.deepEqual(completions[0].data, completions[3].data);
  assert.equal(completions[0].data.score, 100);
  const state = (await db.query("select s.total_questions, s.earned_stars, w.balance from sessions s join star_wallets w on s.child_profile_id=w.child_profile_id where s.id=$1", [learningId])).rows[0];
  assert.equal(state.balance, state.total_questions + 5);
  assert.equal(state.earned_stars, state.balance);
  assert.equal((await db.query("select status from stage_progress where child_profile_id=$1 and stage_id='stage-fruit-2'", [childId])).rows[0].status, "unlocked");
});

test("真实 HTTP：同步项目逐条确认、失败原因和独立下行游标", async () => {
  const started = await child.request("/api/learning/sessions", { stageId: "stage-fruit-2" }); expectStatus(started, 201);
  const sessionId = started.data.session.id;
  const answer = await correctAnswer(sessionId);
  const item = { id: "queue-attempt-v1", entity: "attempts", entityId: "sync-test-answer", childProfileId: childId, deviceId: child.deviceId,
    op: "insert", version: 1, createdAt: Date.now(), status: "local_dirty", payload: { ...answer, sessionId } };
  const bad = { ...item, id: "queue-attempt-v2", version: 2, payload: { ...item.payload, latencyMs: 999 } };
  const unsupported = { ...item, id: "queue-derived", entity: "proficiencies" };
  const input = { childProfileId: childId, deviceId: child.deviceId, lastSyncVersion: 0, items: [item, bad, unsupported] };
  const result = await child.request("/api/sync", input); expectStatus(result);
  assert.equal(result.data.accepted, 1);
  assert.deepEqual(result.data.acknowledgements.map((ack: { status: string }) => ack.status), ["accepted", "rejected", "rejected"]);
  assert.equal(result.data.acknowledgements[1].error, "IDEMPOTENCY_CONFLICT");
  assert.equal(result.data.acknowledgements[2].statusCode, 501);
  const cursors = result.data.serverItems.map((row: { cursor: number }) => row.cursor);
  assert.deepEqual(cursors, Array.from({ length: cursors.length }, (_, index) => index + 1));
  assert.equal(result.data.serverVersion, cursors.at(-1));
  assert.ok(result.data.serverItems.some((row: { version: number; cursor: number }) => row.version === 1 && row.cursor > 1));
  const reordered = { ...item, payload: { sessionId, idempotencyKey: answer.idempotencyKey, latencyMs: answer.latencyMs, optionId: answer.optionId, questionId: answer.questionId } };
  const repeated = await child.request("/api/sync", { ...input, items: [reordered], lastSyncVersion: result.data.serverVersion }); expectStatus(repeated);
  assert.equal(repeated.data.serverItems.length, 0);
  assert.equal(repeated.data.accepted, 1);
  const changed = await child.request("/api/sync", { ...input, items: [{ ...item, payload: { ...item.payload, latencyMs: 2000 } }] });
  assert.equal(changed.data.acknowledgements[0].error, "SYNC_CONFLICT");
  expectStatus(await child.request("/api/sync", { ...input, childProfileId: secondChildId }), 403);
  const foreign = await child.request("/api/sync", { ...input, items: [{ ...item, id: "foreign", childProfileId: secondChildId }] });
  assert.equal(foreign.data.acknowledgements[0].error, "SYNC_SCOPE");
  assert.equal(Number((await db.query("select count(*) from attempts where idempotency_key=$1", [answer.idempotencyKey])).rows[0].count), 1);
});

test("真实 HTTP：收藏并发兑换只扣除一次余额", async () => {
  await db.query("update star_wallets set balance=50,total_earned=50 where child_profile_id=$1", [childId]);
  const results = await Promise.all(Array.from({ length: 4 }, () => child.request("/api/collection", { itemKey: "strawberry" })));
  results.forEach(result => expectStatus(result));
  assert.equal(Number((await db.query("select count(*) from collection_items where child_profile_id=$1 and item_key='strawberry'", [childId])).rows[0].count), 1);
  assert.equal(new Set(results.map(result => result.data.balance)).size, 1);
  assert.ok(results[0].data.balance < 50);
});

test("真实 HTTP：对战在服务端判题，提前结算及未实现能力返回明确错误", async () => {
  const battle = await child.request("/api/battle", { action: "create-ai", stageId: "stage-fruit-1", childAccuracy: 1 }); expectStatus(battle, 201);
  battleId = battle.data.battleId;
  expectStatus(await child.request("/api/battle", { action: "resolve", battleId }), 409);
  expectStatus(await secondChild.request(`/api/battle/${battleId}`), 403);
  expectStatus(await guardian.request(`/api/battle/${battleId}`));
  expectStatus(await child.request("/api/battle", { action: "accept-parent", battleId }), 501);
  const before = (await db.query("select balance from star_wallets where child_profile_id=$1", [childId])).rows[0].balance;
  for (let roundIndex = 1; roundIndex <= 3; roundIndex++) {
    const detail = (await child.request(`/api/battle/${battleId}`)).data.battle;
    assert.equal(detail.rank, null);
    const question = (await db.query("select * from questions where id=$1", [detail.question.id])).rows[0];
    const optionId = FRUIT_OPTIONS.find(option => option.label === question.options[question.correct_index])!.id;
    const request = { action: "submit-round", battleId, questionId: question.id, roundIndex, optionId, latencyMs: 0, correct: false, aiCorrect: true };
    const responses = await Promise.all([child.request("/api/battle", request), child.request("/api/battle", request)]);
    responses.forEach(result => expectStatus(result));
  }
  const final = (await child.request(`/api/battle/${battleId}`)).data.battle;
  assert.equal(final.status, "resolved");
  const settled = await Promise.all(Array.from({ length: 3 }, () => child.request("/api/battle", { action: "resolve", battleId })));
  settled.forEach(result => expectStatus(result));
  assert.equal(Number((await db.query("select count(*) from battle_rounds where battle_id=$1", [battleId])).rows[0].count), 6);
  const after = (await db.query("select balance from star_wallets where child_profile_id=$1", [childId])).rows[0].balance;
  assert.equal(after, before + (final.winnerId === childId ? 10 : 0));
});

test("真实 HTTP：旧签名会话检查数据库身份后换发，家长登录保留儿童数据", async () => {
  const legacy = client();
  const token = signSessionValue(JSON.stringify({ userId: childUserId, childProfileId: childId, role: "child", issuedAt: Date.now(), expiresAt: Date.now() + 3600000 }), process.env.SESSION_SECRET!);
  await legacy.jar.setCookie(`ws_session=${token}; Path=/; HttpOnly`, base);
  const upgraded = await legacy.request("/api/auth", { action: "guest-signup", deviceId: legacy.deviceId }); expectStatus(upgraded);
  assert.equal(upgraded.data.childProfileId, childId);
  expectStatus(await legacy.request("/api/learning/sessions", { stageId: "stage-fruit-2" }), 403);
  const before = (await db.query("select count(*) from attempts where child_profile_id=$1", [childId])).rows[0].count;
  expectStatus(await legacy.request("/api/auth/sign-in/email", { email: "guardian@example.com", password: "wordspire-real-test-password" }));
  assert.equal((await db.query("select role from users where id=$1", [childUserId])).rows[0].role, "child");
  assert.equal((await db.query("select count(*) from attempts where child_profile_id=$1", [childId])).rows[0].count, before);
  expectStatus(await child.request("/api/child/overview"));
  const forged = client();
  const wrong = signSessionValue(JSON.stringify({ userId: guardianId, childProfileId: childId, role: "child", issuedAt: Date.now(), expiresAt: Date.now() + 3600000 }), process.env.SESSION_SECRET!);
  await forged.jar.setCookie(`ws_session=${wrong}; Path=/`, base);
  expectStatus(await forged.request("/api/auth", { action: "guest-signup" }), 401);
  const invalid = client(); await invalid.jar.setCookie("ws_session=invalid.signature; Path=/", base);
  expectStatus(await invalid.request("/api/auth", { action: "guest-signup" }), 401);
});

test("真实 HTTP：Cron 鉴权、真实失败记录、重试和重复调用保护", async () => {
  assert.equal((await fetch(`${base}/api/cron/weekly-report`)).status, 401);
  assert.equal((await fetch(`${base}/api/cron/risk-scan`, { headers: { Authorization: "Bearer wrong" } })).status, 401);
  const cron = (path: string) => fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  await db.query("create function test_fail_report() returns trigger language plpgsql as $$ begin raise exception 'test report transaction failure'; end $$");
  await db.query("create trigger test_fail_report before insert on learning_reports for each row execute function test_fail_report()");
  try { assert.equal((await cron("/api/cron/weekly-report")).status, 500); }
  finally { await db.query("drop trigger test_fail_report on learning_reports"); await db.query("drop function test_fail_report()"); }
  assert.equal((await db.query("select status from cron_runs where task='weekly-report'")).rows[0].status, "failed");
  assert.equal(Number((await db.query("select count(*) from learning_reports")).rows[0].count), 0);
  const results = await Promise.all([cron("/api/cron/weekly-report"), cron("/api/cron/weekly-report"), cron("/api/cron/weekly-report")]);
  assert.ok(results.every(response => [200, 409].includes(response.status)));
  assert.equal((await cron("/api/cron/weekly-report")).status, 200);
  assert.equal(Number((await db.query("select count(*) from learning_reports where child_profile_id=$1", [childId])).rows[0].count), 1);
  assert.equal(Number((await db.query("select count(*) from notifications where user_id=$1 and kind='weekly_report'", [guardianId])).rows[0].count), 1);
  assert.equal(Number((await db.query("select count(*) from cron_attempts where status='failed' and error like '%test report transaction failure%'")).rows[0].count), 1);
  await db.query("update child_profiles set last_active_at=now()-interval '6 days', status='active' where id=$1", [childId]);
  assert.equal((await cron("/api/cron/risk-scan")).status, 200);
  assert.equal((await cron("/api/cron/risk-scan")).status, 200);
  assert.equal(Number((await db.query("select count(*) from notifications where user_id=$1 and kind='at_risk'", [guardianId])).rows[0].count), 1);
  assert.equal((await db.query("select status from child_profiles where id=$1", [childId])).rows[0].status, "at_risk");
});

test("真实 HTTP：报告空状态、通知所属权限、校验详情和 OpenAPI", async () => {
  const report = await secondChild.request("/api/report"); expectStatus(report);
  assert.equal(report.data.report.status, "empty");
  assert.equal(report.data.report.overview.accuracy, null);
  assert.deepEqual(report.data.report.abilities, []);
  assert.deepEqual(report.data.report.achievements, []);
  const notices = await guardian.request("/api/notify"); expectStatus(notices);
  assert.ok(notices.data.items.length > 0);
  const id = notices.data.items[0].id;
  expectStatus(await child.request("/api/notify", { ids: [id] }));
  assert.equal((await db.query("select status from notifications where id=$1", [id])).rows[0].status, "queued");
  expectStatus(await guardian.request("/api/notify", { ids: [id] }));
  assert.equal((await db.query("select status from notifications where id=$1", [id])).rows[0].status, "read");
  const invalid = await child.request("/api/learning/sessions", { stageId: 123 }); expectStatus(invalid, 400);
  assert.ok(invalid.data.issues.length); assert.equal(invalid.data.requestId, invalid.response.headers.get("x-request-id"));
  const malformed = await makeFetchCookie(globalThis.fetch, child.jar)(`${base}/api/sync`, { method: "POST", headers: { "Content-Type": "application/json", "X-WordSpire-Device-Id": child.deviceId }, body: "{" });
  assert.equal(malformed.status, 400);
  const spec = await fetch(`${base}/api/openapi`); assert.equal(spec.status, 200);
  const document = await spec.json();
  assert.ok(Object.keys(document.paths).length >= 25);
  await SwaggerParser.validate(document);
  const code = (await child.request("/api/child/friend-code")).data.code;
  const bindings = [];
  for (let index = 0; index < 10; index++) bindings.push(await guardian.request("/api/bindings", { code }));
  assert.ok(bindings.some(result => result.response.status === 429));
});

test("真实 HTTP：跨儿童并发使用相同 160 字符幂等标识，只产生一条答题记录", async () => {
  const firstSession = (await child.request("/api/learning/sessions", { stageId: "stage-fruit-2" })).data.session.id;
  const secondSession = (await secondChild.request("/api/learning/sessions", { stageId: "stage-fruit-1" })).data.session.id;
  const idempotencyKey = "global-attempt-".padEnd(160, "x");
  const results = await Promise.all([
    child.request(`/api/learning/sessions/${firstSession}/attempts`, { ...await correctAnswer(firstSession), idempotencyKey }),
    secondChild.request(`/api/learning/sessions/${secondSession}/attempts`, { ...await correctAnswer(secondSession), idempotencyKey }),
  ]);
  assert.deepEqual(results.map(result => result.response.status).sort(), [200, 409]);
  assert.equal(Number((await db.query("select count(*) from attempts where idempotency_key=$1", [idempotencyKey])).rows[0].count), 1);
});

test("真实 HTTP：过期会话和数据库认证限流", async () => {
  const user = (await db.query("select user_id from child_profiles where id=$1", [secondChildId])).rows[0].user_id;
  await db.query("update auth_sessions set expires_at=now()-interval '1 second' where user_id=$1", [user]);
  expectStatus(await secondChild.request("/api/child/overview"), 401);
  const responses = [];
  for (let index = 0; index < 11; index++) responses.push(await client().request("/api/auth/sign-in/email", { email: "nobody@example.com", password: "invalid-password" }));
  assert.ok(responses.some(result => result.response.status === 429));
  assert.ok(Number((await db.query("select count(*) from rate_limits")).rows[0].count) > 0);
});
