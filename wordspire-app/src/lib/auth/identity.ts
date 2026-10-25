import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "../db";
import { authSessions, childProfiles, guardianLinks, users } from "../db/schema";
import { AppError } from "../http/errors";
import type { UserRole } from "@/types";

export interface SessionData {
  userId: string;
  role: UserRole;
  sessionId: string;
  childProfileId?: string;
  deviceId: string | null;
  issuedAt: number;
  expiresAt: number;
}

export async function getSession(request?: Request): Promise<SessionData | null> {
  const incoming = request?.headers ?? await headers();
  const verified = await auth.api.getSession({ headers: incoming });
  if (!verified) return null;
  const row = (await db.select({ user: users, session: authSessions, child: childProfiles })
    .from(authSessions).innerJoin(users, eq(users.id, authSessions.userId))
    .leftJoin(childProfiles, eq(childProfiles.userId, users.id))
    .where(and(eq(authSessions.id, verified.session.id), eq(authSessions.userId, verified.user.id))).limit(1))[0];
  if (!row || row.session.expiresAt.getTime() <= Date.now()) return null;
  if (row.user.role !== "child" && row.user.role !== "guardian") throw new Error("数据库角色无效");
  return { userId: row.user.id, role: row.user.role, sessionId: row.session.id,
    childProfileId: row.child?.id, deviceId: row.session.deviceId,
    issuedAt: row.session.createdAt.getTime(), expiresAt: row.session.expiresAt.getTime() };
}

export async function requireSession(request?: Request): Promise<SessionData> {
  const session = await getSession(request);
  if (!session) throw new AppError("UNAUTHORIZED", 401);
  return session;
}

export async function requireChildSession(request?: Request, write = false): Promise<SessionData & { childProfileId: string }> {
  const session = await requireSession(request);
  if (session.role !== "child" || !session.childProfileId) throw new AppError("FORBIDDEN", 403);
  if (write) {
    const incoming = request?.headers ?? await headers();
    const deviceId = incoming.get("x-wordspire-device-id");
    const child = (await db.select().from(childProfiles).where(eq(childProfiles.id, session.childProfileId)))[0];
    if (!deviceId || !child.primaryDeviceId || deviceId !== child.primaryDeviceId || session.deviceId !== deviceId) throw new AppError("PRIMARY_DEVICE_REQUIRED", 403);
  }
  return { ...session, childProfileId: session.childProfileId };
}

export async function requireGuardianSession(request?: Request): Promise<SessionData> {
  const session = await requireSession(request);
  if (session.role !== "guardian") throw new AppError("FORBIDDEN", 403);
  return session;
}

export async function requireChildAccess(childProfileId: string, request?: Request): Promise<SessionData> {
  const session = await requireSession(request);
  if (session.role === "child") {
    if (session.childProfileId !== childProfileId) throw new AppError("FORBIDDEN", 403);
  } else {
    const link = (await db.select({ id: guardianLinks.id }).from(guardianLinks).where(and(
      eq(guardianLinks.guardianUserId, session.userId), eq(guardianLinks.childProfileId, childProfileId), eq(guardianLinks.status, "active"))).limit(1))[0];
    if (!link) throw new AppError("FORBIDDEN", 403);
  }
  return session;
}
