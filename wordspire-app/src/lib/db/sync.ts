import { createHash } from "node:crypto";
import stringify from "fast-json-stable-stringify";
import { and, asc, desc, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "./index";
import { sessions, proficiencies, syncChanges, syncReceipts } from "./schema";
import { childTransaction, lockChild } from "./transaction";
import type { SyncRequest, SyncResponse, SyncQueueItem } from "@/types";
import { createLearningSession, submitLearningAttempt, completeLearningSession } from "../learning/service";
import { AppError } from "../http/errors";
import type { Transaction } from "./index";
import { getLatestSyncChange } from "./sync-records";
import { decideSyncVersion } from "./sync-policy";

import { syncSchema } from "../http/sync-contracts";
export { syncSchema } from "../http/sync-contracts";
const eventTime = z.number().int().nonnegative().refine(value => value <= Date.now() + 300000, "时间超出允许范围");
const sessionPayload = z.object({ stageId: z.string().min(1).max(21), startedAt: eventTime.optional(), endedAt: eventTime.nullable().optional() });
const attemptPayload = z.object({ sessionId: z.string().min(1).max(21), questionId: z.string().min(1).max(21), optionId: z.string().min(1).max(128),
  latencyMs: z.number().int().min(0).max(120000), idempotencyKey: z.string().min(8).max(160).optional() });

export async function mergeSync(input: SyncRequest): Promise<SyncResponse> {
  const req = syncSchema.parse(input);
  const acknowledgements: SyncResponse["acknowledgements"] = [];
  for (const item of req.items) {
    try {
      if (item.childProfileId !== req.childProfileId || item.deviceId !== req.deviceId) throw new AppError("SYNC_SCOPE", 403);
      const fingerprint = createHash("sha256").update(stringify({ entity: item.entity, entityId: item.entityId, op: item.op, version: item.version, deviceId: item.deviceId, payload: item.payload })).digest("hex");
      await childTransaction(req.childProfileId, async tx => {
        const receipt = (await tx.select().from(syncReceipts).where(and(eq(syncReceipts.childProfileId, req.childProfileId), eq(syncReceipts.id, item.id))))[0];
        if (receipt) {
          if (receipt.fingerprint !== fingerprint) throw new AppError("SYNC_CONFLICT", 409);
          return;
        }
        const latest = await getLatestSyncChange(tx, req.childProfileId, item.entity, item.entityId);
        const decision = decideSyncVersion({ incomingVersion: item.version, currentVersion: latest?.version ?? null,
          incomingDeviceId: item.deviceId, currentDeviceId: latest?.deviceId === "server" ? item.deviceId : latest?.deviceId });
        if (decision === "stale" || decision === "conflict") throw new AppError(decision === "stale" ? "SYNC_STALE" : "SYNC_CONFLICT", 409);
        await applyItem(tx, item);
        await tx.insert(syncReceipts).values({ id: item.id, childProfileId: req.childProfileId, fingerprint });
      });
      acknowledgements.push({ id: item.id, entityId: item.entityId, status: "accepted" });
    } catch (error) {
      if (!(error instanceof AppError) && !(error instanceof z.ZodError)) throw error;
      acknowledgements.push({ id: item.id, entityId: item.entityId, status: "rejected", error: error instanceof AppError ? error.code : "SYNC_INVALID_PAYLOAD",
        statusCode: error instanceof AppError ? error.status : 400, issues: error instanceof z.ZodError ? error.issues : undefined });
    }
  }
  const downlink = await db.transaction(async tx => {
    const child = await lockChild(tx, req.childProfileId);
    const rows = await tx.select().from(syncChanges).where(and(eq(syncChanges.childProfileId, req.childProfileId),
      gt(syncChanges.cursor, req.lastSyncVersion), lte(syncChanges.cursor, child.syncCursor))).orderBy(asc(syncChanges.cursor)).limit(500);
    const serverItems: SyncQueueItem[] = rows.map(row => ({ ...row, op: row.op as SyncQueueItem["op"], status: "synced", createdAt: row.createdAt.getTime() }));
    return { serverItems, serverVersion: rows.at(-1)?.cursor ?? Math.min(req.lastSyncVersion, child.syncCursor), hasMore: rows.length === 500 && rows.at(-1)!.cursor < child.syncCursor };
  });
  return { accepted: acknowledgements.filter(item => item.status === "accepted").length,
    rejected: acknowledgements.filter(item => item.status === "rejected").map(item => item.entityId), acknowledgements, ...downlink };
}

async function applyItem(tx: Transaction, item: SyncQueueItem) {
  if (!item.payload) throw new AppError("SYNC_PAYLOAD_REQUIRED", 400);
  if (item.entity === "sessions") {
    const data = sessionPayload.parse(item.payload);
    if (item.entityId.length > 21) throw new AppError("SYNC_INVALID_ENTITY_ID", 400);
    if (data.endedAt) {
      await completeLearningSession(item.entityId, item.childProfileId, tx);
    } else {
      await createLearningSession({ childProfileId: item.childProfileId, stageId: data.stageId, id: item.entityId,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined }, tx);
    }
  } else if (item.entity === "attempts") {
    const data = attemptPayload.parse(item.payload);
    await submitLearningAttempt({ ...data, childProfileId: item.childProfileId, idempotencyKey: data.idempotencyKey ?? item.entityId }, tx);
  } else if (item.entity === "proficiencies" || item.entity === "stage_progress") {
    throw new AppError("SERVER_DERIVED_ENTITY", 501, "掌握度和关卡状态由学习服务计算，请同步答题记录和会话结算。" );
  } else throw new AppError("SYNC_ENTITY_UNSUPPORTED", 501);
}

export async function listSessions(childProfileId: string, limit = 20) {
  return db.select().from(sessions).where(eq(sessions.childProfileId, childProfileId)).orderBy(desc(sessions.startedAt)).limit(limit);
}
export async function getProficiency(childProfileId: string, targetWord: string) {
  return (await db.select().from(proficiencies).where(and(eq(proficiencies.childProfileId, childProfileId), eq(proficiencies.targetWord, targetWord))).limit(1))[0] ?? null;
}
