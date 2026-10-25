import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { createAuthEndpoint, getSessionFromCtx, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { runWithAdapter } from "@better-auth/core/context";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, type DatabaseExecutor } from "../db";
import { users, authSessions, authAccounts, authVerifications, rateLimits, childProfiles } from "../db/schema";
import { getEnv } from "../config/env";
import { randomNickname } from "../utils";
import { initializeChild } from "./defaults";
import { verifySessionValue } from "./session-codec";
import { cleanMessage, logger } from "../http/logger";
import { AppError } from "../http/errors";

export const guestSchema = z.object({
  action: z.literal("guest-signup").default("guest-signup"), age: z.number().int().min(4).max(11).default(7),
  grade: z.string().min(1).max(16).default("一年级"), deviceId: z.string().uuid().optional(),
});

function makeAuth(executor: DatabaseExecutor, transactional = false, plugins: BetterAuthPlugin[] = []) {
  const env = getEnv();
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(executor, { provider: "pg", transaction: !transactional,
      schema: { user: users, session: authSessions, account: authAccounts, verification: authVerifications, rateLimit: rateLimits } }),
    emailAndPassword: { enabled: true },
    onAPIError: { throw: true },
    user: { fields: { name: "nickname", image: "avatarUrl" }, additionalFields: { role: { type: "string", required: true, defaultValue: "guardian", input: false } } },
    session: { modelName: "session", expiresIn: 30 * 86400, cookieCache: { enabled: false }, additionalFields: { deviceId: { type: "string", required: false, input: false } } },
    advanced: { cookiePrefix: "wordspire", database: { generateId: () => nanoid() } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 100,
      customRules: { "/sign-in/email": { window: 60, max: 10 }, "/sign-up/email": { window: 60, max: 10 }, "/guest": { window: 60, max: 20 } } },
    databaseHooks: { user: { create: { before: async user => ({ data: { ...user, role: (user as typeof user & { isAnonymous?: boolean }).isAnonymous ? "child" : "guardian" } }) } } },
    logger: { log(level, message, ...args) { if (level === "error" || level === "warn") logger.warn({ err: args.find(value => value instanceof Error) }, cleanMessage(message)); } },
    plugins: [anonymous({ generateName: randomNickname, disableDeleteAnonymousUser: true }), ...plugins],
  });
}

const guestPlugin = {
  id: "wordspire-guest",
  endpoints: {
    guest: createAuthEndpoint("/guest", { method: "POST", body: guestSchema }, async ctx => {
      const body = ctx.body;
      const deviceId = body.deviceId ?? ctx.headers?.get("x-wordspire-device-id") ?? crypto.randomUUID();
      if (!z.string().uuid().safeParse(deviceId).success) throw new APIError("BAD_REQUEST", { message: "INVALID_DEVICE" });
      const current = await getSessionFromCtx(ctx);
      const oldCookie = ctx.getCookie("ws_session");
      const legacy = oldCookie && getEnv().SESSION_SECRET ? verifySessionValue(oldCookie, getEnv().SESSION_SECRET!) : null;
      if (!current && oldCookie && !legacy) throw new APIError("UNAUTHORIZED", { message: "INVALID_LEGACY_SESSION" });
      if (current && current.user.role !== "child") throw new APIError("FORBIDDEN", { message: "FORBIDDEN" });
      if (legacy && legacy.role !== "child") throw new APIError("FORBIDDEN", { message: "FORBIDDEN" });
      const result = await db.transaction(async tx => {
        const context = await makeAuth(tx, true).$context;
        return runWithAdapter(context.adapter, async () => {
        let user;
        if (current) {
          const saved = (await tx.select().from(users).where(eq(users.id, current.user.id)).for("update"))[0];
          if (!saved || saved.role !== "child") throw new APIError("FORBIDDEN", { message: "FORBIDDEN" });
          user = current.user;
        } else if (legacy) {
          const saved = (await tx.select().from(users).where(eq(users.id, legacy.userId)).for("update"))[0];
          const profile = (await tx.select().from(childProfiles).where(eq(childProfiles.userId, legacy.userId)))[0];
          if (!saved || saved.role !== "child" || profile?.id !== legacy.childProfileId) throw new APIError("UNAUTHORIZED", { message: "INVALID_LEGACY_SESSION" });
          user = { ...saved, name: saved.nickname, image: saved.avatarUrl, email: saved.email!, isAnonymous: true };
        } else {
          user = await context.internalAdapter.createUser({ name: randomNickname(), email: `${nanoid()}@anonymous.placeholder.invalid`, emailVerified: false, isAnonymous: true }, { method: "anonymous" });
        }
        const profile = await initializeChild(tx, user.id, deviceId, body.age, body.grade);
        const session = current?.session ?? await context.internalAdapter.createSession(user.id, false, { deviceId });
        return { user, session, profile };
        });
      });
      await setSessionCookie(ctx, { user: result.user, session: result.session });
      ctx.setCookie("ws_session", "", { path: "/", maxAge: 0 });
      return ctx.json({ userId: result.user.id, childProfileId: result.profile.id, nickname: result.user.name, deviceId });
    }),
  },
} satisfies BetterAuthPlugin;

export const auth = makeAuth(db, false, [guestPlugin]);

export async function limitBinding(userId: string): Promise<void> {
  const key = `guardian-link:${userId}`;
  const now = Date.now();
  const result = await db.execute(sql`insert into rate_limits (id, key, count, last_request) values (${nanoid()}, ${key}, 1, ${now})
    on conflict (key) do update set count = case when rate_limits.last_request < ${now - 60000} then 1 else rate_limits.count + 1 end,
    last_request = case when rate_limits.last_request < ${now - 60000} then ${now} else rate_limits.last_request end returning count`);
  if (Number(result.rows[0].count) > 10) throw new AppError("RATE_LIMITED", 429);
}
