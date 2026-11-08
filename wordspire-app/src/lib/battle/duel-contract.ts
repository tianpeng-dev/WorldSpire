import { z } from "zod";
import type { QuestionDTO } from "@/types";
import { idSchema } from "@/lib/http/contracts";

export const DUEL_ROUNDS = 10;
export const DUEL_ROUND_MS = 10_000;
export const duelCreateSchema = z.strictObject({ stageId: idSchema });
export const duelAnswerSchema = z.strictObject({
  roundIndex: z.number().int().min(1).max(DUEL_ROUNDS),
  optionId: z.string().min(1).max(128),
});

export type DuelState = {
  id: string;
  status: "waiting" | "playing" | "finished" | "closed";
  endedReason: string | null;
  hasOpponent: boolean;
  ready: boolean;
  opponentReady: boolean;
  roundIndex: number;
  answered: boolean;
  question: QuestionDTO | null;
  remainingMs: number;
  score: number;
  opponentScore: number;
  result: "win" | "loss" | "draw" | null;
};
