import { z } from "zod";
export const idSchema = z.string().min(1).max(21);
export const startSchema = z.object({ stageId: idSchema });
export const attemptSchema = z.object({ questionId: idSchema, optionId: z.string().min(1).max(128),
  latencyMs: z.number().int().min(0).max(120000), idempotencyKey: z.string().min(8).max(160) });
export const roundSchema = z.object({ battleId: idSchema, questionId: idSchema, optionId: z.string().min(1).max(128),
  latencyMs: z.number().int().min(0).max(120000), roundIndex: z.number().int().min(1).max(3) });
export const battleSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-ai"), stageId: idSchema, childAccuracy: z.number().min(0).max(1).optional() }),
  z.object({ action: z.literal("accept-parent"), battleId: idSchema }),
  roundSchema.extend({ action: z.literal("submit-round") }),
  z.object({ action: z.literal("resolve"), battleId: idSchema }),
]);
export const unlockSchema = z.object({ itemKey: z.string().min(1).max(64) });
export const notifySchema = z.object({ ids: z.array(idSchema).max(100) });
export const bindingSchema = z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/) });
export const changeBindingSchema = z.object({ action: z.enum(["confirm", "revoke"]) });
