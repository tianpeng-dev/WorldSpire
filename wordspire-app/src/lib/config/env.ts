import { createRequire } from "node:module";
import { z } from "zod";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");

export const envSchema = z.object({
  POSTGRES_URL: z.string().url().refine(value => ["postgres:", "postgresql:"].includes(new URL(value).protocol), "需要 PostgreSQL 连接地址"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CRON_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32).optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_MODEL: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  FCM_SERVER_KEY: z.string().optional(),
});

export type BackendEnv = z.infer<typeof envSchema>;
let environment: BackendEnv | undefined;

export function parseEnv(input: Record<string, string | undefined>): BackendEnv {
  const parsed = envSchema.safeParse(Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? undefined : value])));
  if (!parsed.success) {
    const names = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`后端配置无效：${names}`);
  }
  return parsed.data;
}

export function getEnv(): BackendEnv {
  if (!environment) {
    if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("后端命令和服务要求 Node.js 24。");
    loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
    environment = parseEnv(process.env);
  }
  return environment;
}
