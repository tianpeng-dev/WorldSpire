import { and, desc, eq, inArray } from "drizzle-orm";
import { db, type DatabaseExecutor } from "../db";
import { notifications } from "../db/schema";
import { newId } from "../utils";
import { getEnv } from "../config/env";
import { notConfigured, unsupported } from "../http/errors";
import type { NotificationKind } from "@/types";

export interface PushPayload { title: string; body: string; kind: NotificationKind; data?: Record<string, string> }
export async function sendPush(userId: string, payload: PushPayload, executor: DatabaseExecutor = db) {
  const row = (await executor.insert(notifications).values({ id: newId(), userId, kind: payload.kind, payload, status: "queued" }).returning())[0];
  return { queued: true, notificationId: row.id };
}
export async function sendWeeklyReportNotification(guardianUserIds: string[], childProfileId: string, executor: DatabaseExecutor = db) {
  for (const id of guardianUserIds) await sendPush(id, { title: "学习周报", body: "孩子本周的学习报告已经生成。", kind: "weekly_report", data: { childProfileId } }, executor);
}
export async function sendAtRiskNotification(guardianUserId: string, childProfileId: string, executor: DatabaseExecutor = db) {
  return sendPush(guardianUserId, { title: "学习提醒", body: "孩子已有五天没有学习记录。", kind: "at_risk", data: { childProfileId } }, executor);
}
export async function deliverPush(_notificationId: string) {
  if (!getEnv().FCM_SERVER_KEY) notConfigured("设备推送");
  unsupported("设备推送发送器");
}
export async function listNotifications(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.triggeredAt)).limit(100);
}
export async function markNotificationsRead(userId: string, ids: string[]) {
  if (ids.length) await db.update(notifications).set({ status: "read" }).where(and(eq(notifications.userId, userId), inArray(notifications.id, ids)));
}
