import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { childProfiles, guardianLinks, users } from "../db/schema";
import { newId } from "../utils";
import { AppError } from "../http/errors";
import { limitBinding } from "../auth/auth";
import type { SessionData } from "../auth/session";

export async function requestBinding(guardianUserId: string, code: string) {
  await limitBinding(guardianUserId);
  return db.transaction(async tx => {
    const child = (await tx.select().from(childProfiles).where(eq(childProfiles.friendCode, code)).for("update"))[0];
    if (!child) throw new AppError("FRIEND_CODE_NOT_FOUND", 404);
    const existing = (await tx.select().from(guardianLinks).where(and(eq(guardianLinks.guardianUserId, guardianUserId), eq(guardianLinks.childProfileId, child.id))))[0];
    if (existing && existing.status !== "revoked") return existing;
    if (existing) return (await tx.update(guardianLinks).set({ status: "pending", code, createdAt: new Date() }).where(eq(guardianLinks.id, existing.id)).returning())[0];
    return (await tx.insert(guardianLinks).values({ id: newId(), guardianUserId, childProfileId: child.id, code, status: "pending" }).returning())[0];
  });
}

export async function listBindings(session: SessionData) {
  return db.select({ id: guardianLinks.id, guardianUserId: guardianLinks.guardianUserId, childProfileId: guardianLinks.childProfileId,
    status: guardianLinks.status, createdAt: guardianLinks.createdAt, guardianName: users.nickname })
    .from(guardianLinks).innerJoin(users, eq(users.id, guardianLinks.guardianUserId))
    .where(session.role === "child" ? eq(guardianLinks.childProfileId, session.childProfileId!) : eq(guardianLinks.guardianUserId, session.userId));
}

export async function changeBinding(session: SessionData, id: string, action: "confirm" | "revoke") {
  return db.transaction(async tx => {
    const link = (await tx.select().from(guardianLinks).where(eq(guardianLinks.id, id)).for("update"))[0];
    if (!link) throw new AppError("BINDING_NOT_FOUND", 404);
    const participant = session.role === "child" ? link.childProfileId === session.childProfileId : link.guardianUserId === session.userId;
    if (!participant || action === "confirm" && session.role !== "child") throw new AppError("FORBIDDEN", 403);
    if (action === "confirm" && link.status === "revoked") throw new AppError("BINDING_REVOKED", 409);
    return (await tx.update(guardianLinks).set({ status: action === "confirm" ? "active" : "revoked" }).where(eq(guardianLinks.id, id)).returning())[0];
  });
}

export async function listBoundChildren(guardianUserId: string) {
  return db.select({ id: childProfiles.id, nickname: users.nickname, age: childProfiles.age, grade: childProfiles.grade })
    .from(guardianLinks).innerJoin(childProfiles, eq(childProfiles.id, guardianLinks.childProfileId))
    .innerJoin(users, eq(users.id, childProfiles.userId)).where(and(eq(guardianLinks.guardianUserId, guardianUserId), eq(guardianLinks.status, "active")));
}
