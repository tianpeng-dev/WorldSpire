import { and, asc, desc, eq } from "drizzle-orm";
import { db, type Transaction, type DatabaseExecutor } from "@/lib/db";
import { attempts, battles, battleRounds, childProfiles, leaderboardEntries, stages, users } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { getStageQuestions, questionToDto } from "@/lib/child/server";
import { calcBotConfig, calcRoundScore, simulateAiAnswer } from "./bot";
import { childTransaction } from "../db/transaction";
import { recordSyncChange } from "../db/sync-records";
import { creditStars } from "../rewards/service";
import { AppError, unsupported } from "../http/errors";
import type { BattleDTO, Question } from "@/types";

export async function createAiBattle(params: { childProfileId: string; stageId: string }) {
  return childTransaction(params.childProfileId, async tx => {
    const stage = (await tx.select().from(stages).where(eq(stages.id, params.stageId)))[0];
    if (!stage) throw new AppError("STAGE_NOT_FOUND", 404);
    if (!(await getStageQuestions(stage.id, tx)).length) throw new AppError("STAGE_EMPTY", 409);
    const previous = (await tx.select().from(battles).where(and(eq(battles.childProfileId, params.childProfileId), eq(battles.stageId, stage.id), eq(battles.mode, "ai"), eq(battles.status, "in_progress"))).limit(1))[0];
    const battleId = previous?.id ?? newId();
    if (!previous) {
      await tx.insert(battles).values({ id: battleId, mode: "ai", childProfileId: params.childProfileId, opponentId: "bot_xiaota", stageId: stage.id, status: "in_progress" });
      await recordSyncChange(tx, { childProfileId: params.childProfileId, entity: "battles", entityId: battleId, op: "insert", payload: { stageId: stage.id, status: "in_progress", mode: "ai" } });
    }
    const accuracy = await recentAccuracy(params.childProfileId, tx);
    return { battleId, botConfig: calcBotConfig(accuracy ?? 0.5) };
  });
}

export async function acceptParentBattle(_params: { battleId: string; childProfileId: string }) { unsupported("亲子异步对战"); }
export async function submitBattleRound(params: { battleId: string; childProfileId: string; questionId: string; optionId: string; latencyMs: number; roundIndex: number }) {
  return childTransaction(params.childProfileId, async tx => {
    const battle = await ownedBattle(tx, params.battleId, params.childProfileId);
    if (battle.mode !== "ai") unsupported("亲子异步对战");
    const questions = await getStageQuestions(battle.stageId, tx);
    const question = questions[(params.roundIndex - 1) % questions.length];
    if (!question || question.id !== params.questionId) throw new AppError("QUESTION_OUT_OF_ORDER", 409);
    const option = questionToDto(question).options.findIndex(item => item.id === params.optionId);
    if (option < 0) throw new AppError("INVALID_OPTION", 400);
    const correct = option === question.correctIndex;
    const rows = await tx.select().from(battleRounds).where(eq(battleRounds.battleId, battle.id));
    const existing = rows.find(row => row.playerId === params.childProfileId && row.roundIndex === params.roundIndex);
    if (existing) {
      if (existing.questionId !== params.questionId || existing.correct !== correct || existing.latencyMs !== params.latencyMs) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
      return { battleId: battle.id, status: battle.status, roundIndex: Math.min(3, params.roundIndex + 1), childScore: existing.score,
        aiScore: rows.find(row => row.playerId === battle.opponentId && row.roundIndex === params.roundIndex)!.score };
    }
    if (battle.status !== "in_progress" || rows.filter(row => row.playerId === params.childProfileId).length !== params.roundIndex - 1) throw new AppError("BATTLE_NOT_ACCEPTABLE", 409);
    const ai = simulateAiAnswer(question as Question, calcBotConfig((await recentAccuracy(params.childProfileId, tx)) ?? 0.5));
    const childScore = calcRoundScore(correct, params.latencyMs);
    const aiScore = calcRoundScore(ai.correct, ai.latencyMs);
    await tx.insert(battleRounds).values([
      { id: newId(), ...params, playerId: params.childProfileId, correct, score: childScore },
      { id: newId(), battleId: battle.id, roundIndex: params.roundIndex, playerId: battle.opponentId, questionId: question.id, correct: ai.correct, latencyMs: ai.latencyMs, score: aiScore },
    ]);
    if (params.roundIndex === 3) return { battleId: battle.id, status: "resolved", roundIndex: 3, childScore, aiScore, ...await resolveInTransaction(tx, battle) };
    return { battleId: battle.id, status: "in_progress", roundIndex: params.roundIndex + 1, childScore, aiScore };
  });
}

async function ownedBattle(tx: Transaction, battleId: string, childProfileId: string) {
  const battle = (await tx.select().from(battles).where(and(eq(battles.id, battleId), eq(battles.childProfileId, childProfileId))))[0];
  if (!battle) throw new AppError("BATTLE_NOT_FOUND", 404);
  return battle;
}
export async function resolveBattle(battleId: string, childProfileId: string) {
  return childTransaction(childProfileId, async tx => resolveInTransaction(tx, await ownedBattle(tx, battleId, childProfileId)));
}
async function resolveInTransaction(tx: Transaction, battle: typeof battles.$inferSelect) {
  if (battle.mode !== "ai") unsupported("亲子异步对战");
  const rows = await tx.select().from(battleRounds).where(eq(battleRounds.battleId, battle.id));
  const child = rows.filter(row => row.playerId === battle.childProfileId);
  const opponent = rows.filter(row => row.playerId === battle.opponentId);
  if (child.length !== 3 || opponent.length !== 3) throw new AppError("BATTLE_INCOMPLETE", 409);
  const wins = child.filter(row => row.score > opponent.find(other => other.roundIndex === row.roundIndex)!.score).length;
  const losses = child.filter(row => row.score < opponent.find(other => other.roundIndex === row.roundIndex)!.score).length;
  const winnerId = wins > losses ? battle.childProfileId : wins < losses ? battle.opponentId : null;
  if (battle.status !== "resolved") {
    await tx.update(battles).set({ status: "resolved", winnerId }).where(eq(battles.id, battle.id));
    if (winnerId === battle.childProfileId) await creditStars(tx, battle.childProfileId, 10);
    await recordSyncChange(tx, { childProfileId: battle.childProfileId, entity: "battles", entityId: battle.id, op: "update", payload: { status: "resolved", winnerId, wins, losses } });
  }
  return { childTotal: child.reduce((sum, row) => sum + row.score, 0), opponentScore: opponent.reduce((sum, row) => sum + row.score, 0), winnerId };
}

export async function getBattle(battleId: string) {
  const battle = (await db.select().from(battles).where(eq(battles.id, battleId)))[0];
  if (!battle) throw new AppError("BATTLE_NOT_FOUND", 404);
  const rounds = await db.select().from(battleRounds).where(eq(battleRounds.battleId, battleId)).orderBy(asc(battleRounds.roundIndex));
  const child = (await db.select({ name: users.nickname }).from(childProfiles).innerJoin(users, eq(users.id, childProfiles.userId)).where(eq(childProfiles.id, battle.childProfileId)))[0];
  if (!child) throw new Error("对战儿童档案缺失");
  const other = battle.mode === "ai" ? null : (await db.select().from(users).where(eq(users.id, battle.opponentId)))[0];
  const rank = (await db.select({ rank: leaderboardEntries.rank }).from(leaderboardEntries).where(and(eq(leaderboardEntries.childProfileId, battle.childProfileId), eq(leaderboardEntries.period, "week"))))[0]?.rank ?? null;
  const roundIndex = Math.min(3, rounds.filter(row => row.playerId === battle.childProfileId).length + 1);
  const questions = await getStageQuestions(battle.stageId);
  const question = battle.status === "resolved" ? null : questions[(roundIndex - 1) % questions.length];
  const dto: BattleDTO & { childProfileId: string } = { id: battle.id, mode: battle.mode as BattleDTO["mode"], status: battle.status as BattleDTO["status"],
    roundIndex, totalRounds: 3, childScore: rounds.filter(row => row.playerId === battle.childProfileId).reduce((sum, row) => sum + row.score, 0),
    opponentScore: rounds.filter(row => row.playerId === battle.opponentId).reduce((sum, row) => sum + row.score, 0), childName: child.name,
    opponentName: battle.mode === "ai" ? "小塔" : other?.nickname ?? "", question: question ? questionToDto(question) : null,
    winnerId: battle.winnerId, rank, childProfileId: battle.childProfileId };
  return { battle: dto, rounds };
}
async function recentAccuracy(childProfileId: string, executor: DatabaseExecutor = db): Promise<number | null> {
  const rows = await executor.select({ correct: attempts.correct }).from(attempts).where(eq(attempts.childProfileId, childProfileId)).orderBy(desc(attempts.answeredAt)).limit(100);
  return rows.length ? rows.filter(row => row.correct).length / rows.length : null;
}
export async function getBattleLobby(childProfileId: string) {
  const stage = (await db.select().from(stages).orderBy(asc(stages.order)).limit(1))[0];
  const challenge = (await db.select({ battle: battles, stage: stages }).from(battles).innerJoin(stages, eq(stages.id, battles.stageId))
    .where(and(eq(battles.childProfileId, childProfileId), eq(battles.mode, "parent_async"), eq(battles.status, "invited"))).orderBy(desc(battles.baseDate)).limit(1))[0];
  return { childAccuracy: await recentAccuracy(childProfileId), aiStageId: stage?.id ?? null, parentChallenge: challenge ? {
    battleId: challenge.battle.id, stageTitle: challenge.stage.title, message: "收到亲子对战邀请", expiresAt: challenge.battle.expiresAt?.toISOString() ?? null } : null };
}
