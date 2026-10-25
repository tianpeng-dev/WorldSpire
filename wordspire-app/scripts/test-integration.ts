import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, open, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";

const source = process.env.TEST_DATABASE_URL;
const production = process.argv.includes("--production");
if (!source) throw new Error("必须提供独立的 TEST_DATABASE_URL，数据库名称以 wordspire_test 开头。");
const template = new URL(source);
const prefix = template.pathname.slice(1);
if (!/^wordspire_test[a-z0-9_]{0,24}$/.test(prefix)) throw new Error("测试数据库名称必须以 wordspire_test 开头，且仅含小写字母、数字及下划线。");
const adminUrl = new URL(template); adminUrl.pathname = "/postgres";
const admin = new Pool({ connectionString: adminUrl.toString(), max: 2, options: "-c timezone=UTC" });
const databases: string[] = [];
let server: ReturnType<typeof spawn> | undefined;
let log: Awaited<ReturnType<typeof open>> | undefined;
async function stopServer() {
  if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill("SIGTERM"); await exited; }
  await log?.close(); log = undefined; server = undefined;
}
async function waitForHttp(base: string, logPath: string) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) throw new Error(`HTTP 服务启动失败，请检查 ${logPath}`);
    try { if ((await fetch(`${base}/api/health/live`, { signal: AbortSignal.timeout(1000) })).ok) return; }
    catch (error) { if (!(error instanceof TypeError) && !(error instanceof DOMException)) throw error; }
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  throw new Error(`HTTP 服务启动超时，请检查 ${logPath}`);
}
try {
  const version = Number((await admin.query("show server_version_num")).rows[0].server_version_num);
  if (version < 160000 || version >= 170000) throw new Error("集成验证要求 PostgreSQL 16。");
  const suffix = `${Date.now()}_${randomBytes(3).toString("hex")}`;
  const names = [`${prefix}_${suffix}`, `${prefix}_${suffix}_legacy`];
  for (const name of names) { await admin.query(`create database "${name}"`); databases.push(name); }
  const url = new URL(template); url.pathname = `/${names[0]}`;
  const legacyUrl = new URL(template); legacyUrl.pathname = `/${names[1]}`;
  process.env.TEST_DATABASE_URL = url.toString();
  process.env.POSTGRES_URL = url.toString();
  process.env.TEST_LEGACY_DATABASE_URL = legacyUrl.toString();
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
  process.env.CRON_SECRET = randomBytes(48).toString("base64url");
  process.env.SESSION_SECRET = randomBytes(48).toString("base64url");
  process.env.DATABASE_POOL_MAX = "5";
  Object.assign(process.env, { NODE_ENV: production ? "production" : "development" });
  const listener = createServer(); listener.listen(0, "127.0.0.1"); await once(listener, "listening");
  const address = listener.address(); if (!address || typeof address === "string") throw new Error("HTTP 端口分配失败");
  const port = address.port; listener.close(); await once(listener, "close");
  const base = `http://127.0.0.1:${port}`;
  process.env.BETTER_AUTH_URL = base;
  process.env.TEST_BASE_URL = base;
  for (const script of ["migrate", "migrate", "seed", "seed"]) {
    const command = spawn(process.execPath, ["--import", "tsx", `scripts/${script}.ts`], { stdio: "inherit", env: process.env });
    const [code] = await once(command, "exit");
    if (code !== 0) throw new Error(`数据库命令 ${script} 执行失败。`);
  }
  await mkdir(".work", { recursive: true });
  const logPath = production ? ".work/integration-production-server.log" : ".work/integration-server.log";
  log = await open(logPath, "w");
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    { env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", log.fd, log.fd] });
  server.on("error", error => { throw error; });
  await waitForHttp(base, logPath);
  const tests = spawn(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", "--test-timeout=180000", "tests/integration.test.ts"], { stdio: "inherit", env: process.env });
  const [exit] = await once(tests, "exit");
  let resultCode = Number(exit ?? 1);
  if (production && resultCode === 0) {
    await stopServer();
    const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
    const endpoint = probe.address(); if (!endpoint || typeof endpoint === "string") throw new Error("数据库故障验证端口分配失败");
    const unavailablePort = endpoint.port; probe.close(); await once(probe, "close");
    const unavailableLog = ".work/unavailable-server.log";
    log = await open(unavailableLog, "w");
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      env: { ...process.env, POSTGRES_URL: `postgresql://wordspire_unavailable@127.0.0.1:${unavailablePort}/unavailable`, DATABASE_CONNECT_TIMEOUT_MS: "500", NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", log.fd, log.fd],
    });
    server.on("error", error => { throw error; });
    await waitForHttp(base, unavailableLog);
    const faultTests = spawn(process.execPath, ["--import", "tsx", "--test", "--test-timeout=30000", "tests/health-unavailable.test.ts"], { stdio: "inherit", env: process.env });
    const [faultExit] = await once(faultTests, "exit");
    resultCode = Number(faultExit ?? 1);
  }
  process.exitCode = resultCode;
  await writeFile(production ? ".work/integration-production-result.json" : ".work/integration-result.json", JSON.stringify({ passed: resultCode === 0, production, databaseVersion: version, runAt: new Date().toISOString() }, null, 2));
} finally {
  await stopServer();
  for (const name of databases.reverse()) await admin.query(`drop database "${name}" with (force)`);
  await admin.end();
}
