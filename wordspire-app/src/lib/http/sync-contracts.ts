import { z } from "zod";
export const syncItemSchema = z.object({
  id: z.string().min(1).max(256), childProfileId: z.string().min(1).max(21), entity: z.string().min(1).max(48),
  entityId: z.string().min(1).max(160), op: z.enum(["insert", "update"]), version: z.number().int().positive().max(2147483647),
  deviceId: z.string().uuid(), status: z.enum(["local_dirty", "syncing", "synced", "conflict_resolved"]),
  createdAt: z.number().int().nonnegative(), payload: z.record(z.string(), z.unknown()).optional(),
});
export const syncSchema = z.object({ deviceId: z.string().uuid(), childProfileId: z.string().min(1).max(21),
  items: z.array(syncItemSchema).max(100), lastSyncVersion: z.number().int().nonnegative().max(2147483647) });
export const acknowledgementSchema = z.object({ id: z.string(), entityId: z.string(), status: z.enum(["accepted", "rejected"]),
  error: z.string().optional(), statusCode: z.number().int().optional(), issues: z.unknown().optional() });
export const syncResponseSchema = z.object({ accepted: z.number().int().nonnegative(), rejected: z.array(z.string()),
  acknowledgements: z.array(acknowledgementSchema), serverVersion: z.number().int().nonnegative(),
  serverItems: z.array(syncItemSchema.extend({ deviceId: z.string(), cursor: z.number().int().positive(), status: z.literal("synced") })), hasMore: z.boolean() });

const time = z.number().int().nonnegative();
export const sessionDownlinkSchema = z.object({ stageId: z.string(), startedAt: time, endedAt: time.nullable(),
  durationSec: z.number().int().nonnegative(), currentIndex: z.number().int().nonnegative(), totalQuestions: z.number().int().nonnegative(), earnedStars: z.number().int().nonnegative() });
export const attemptDownlinkSchema = z.object({ sessionId: z.string(), questionId: z.string(), correct: z.boolean(), latencyMs: z.number().int().nonnegative(),
  answeredAt: time, selectedIndex: z.number().int().nonnegative(), optionId: z.string().optional(), idempotencyKey: z.string().optional() });
export const proficiencyDownlinkSchema = z.object({ targetWord: z.string(), p: z.number().min(0).max(1), attempts: z.number().int().nonnegative(), lastSeenAt: time });
export const progressDownlinkSchema = z.object({ stageId: z.string(), status: z.enum(["locked", "unlocked", "in_progress", "completed"]),
  completedStars: z.number().int().nonnegative(), updatedAt: time });
