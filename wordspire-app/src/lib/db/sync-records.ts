import { and, desc, eq, sql } from "drizzle-orm";
import type { Transaction } from "./index";
import { childProfiles, syncChanges } from "./schema";
import { newId } from "../utils";

export interface SyncRecordInput {
  childProfileId: string; entity: string; entityId: string; op: "insert" | "update";
  payload: Record<string, unknown>; deviceId?: string; version?: number;
}

export async function getLatestSyncChange(tx: Transaction, childProfileId: string, entity: string, entityId: string) {
  return (await tx.select().from(syncChanges).where(and(eq(syncChanges.childProfileId, childProfileId),
    eq(syncChanges.entity, entity), eq(syncChanges.entityId, entityId))).orderBy(desc(syncChanges.version)).limit(1))[0] ?? null;
}

export async function recordSyncChange(tx: Transaction, input: SyncRecordInput): Promise<number> {
  const latest = await getLatestSyncChange(tx, input.childProfileId, input.entity, input.entityId);
  const version = input.version ?? (latest?.version ?? 0) + 1;
  const child = (await tx.update(childProfiles).set({ syncCursor: sql`${childProfiles.syncCursor} + 1` })
    .where(eq(childProfiles.id, input.childProfileId)).returning({ cursor: childProfiles.syncCursor }))[0];
  if (!child) throw new Error("同步记录对应的儿童不存在");
  await tx.insert(syncChanges).values({ id: newId(), ...input, version, cursor: child.cursor, deviceId: input.deviceId ?? "server" });
  return version;
}
