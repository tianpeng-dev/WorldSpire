import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { Transaction } from "@/lib/db";
import { attempts, childProfiles, proficiencies, sessions, stageProgress, stages, questions } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import type { AttemptResultDTO, LearningSessionDTO } from "@/types";
import { getLearningSession, getStageQuestions, questionToDto } from "@/lib/child/server";
import { updateProficiency } from "@/lib/adaptive/engine";
import { recordSyncChange } from "@/lib/db/sync-records";
import { childTransaction } from "@/lib/db/transaction";
import { sameAttempt } from "./idempotency";
import { AppError } from "../http/errors";
import { creditStars } from "../rewards/service";

interface StartInput { childProfileId: string; stageId: string; id?: string; startedAt?: Date }
export async function createLearningSession(params: StartInput, transaction?: Transaction): Promise<LearningSessionDTO> {
  return childTransaction(params.childProfileId, async tx => {
    if (params.id) {
      const previous = (await tx.select().from(sessions).where(eq(sessions.id, params.id)))[0];
      if (previous) {
        if (previous.childProfileId !== params.childProfileId || previous.stageId !== params.stageId) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
        return (await getLearningSession(previous.id, params.childProfileId, tx))!;
      }
    }
    const stage = (await tx.select().from(stages).where(eq(stages.id, params.stageId)))[0];
    if (!stage) throw new AppError("STAGE_NOT_FOUND", 404);
    const progress = (await tx.select().from(stageProgress).where(and(eq(stageProgress.childProfileId, params.childProfileId), eq(stageProgress.stageId, params.stageId))))[0];
    if (!progress || progress.status === "locked") throw new AppError("STAGE_LOCKED", 409);
    if (progress.status === "completed") throw new AppError("STAGE_COMPLETED", 409);
    const pending = (await tx.select().from(sessions).where(and(eq(sessions.childProfileId, params.childProfileId), eq(sessions.stageId, params.stageId), isNull(sessions.endedAt))).orderBy(asc(sessions.startedAt)).limit(1))[0];
    if (pending && !params.id) return (await getLearningSession(pending.id, params.childProfileId, tx))!;
    if (pending) throw new AppError("SESSION_IN_PROGRESS", 409);
    const stageQuestions = await getStageQuestions(params.stageId, tx);
    if (!stageQuestions.length) throw new AppError("STAGE_EMPTY", 409);
    const row = (await tx.insert(sessions).values({ id: params.id ?? newId(), childProfileId: params.childProfileId,
      stageId: params.stageId, startedAt: params.startedAt ?? new Date(), totalQuestions: stageQuestions.length }).returning())[0];
    const updated = (await tx.update(stageProgress).set({ status: "in_progress", version: sql`${stageProgress.version} + 1`, updatedAt: new Date() })
      .where(eq(stageProgress.id, progress.id)).returning())[0];
    await recordSyncChange(tx, { childProfileId: params.childProfileId, entity: "sessions", entityId: row.id, op: "insert", payload: sessionPayload(row) });
    await publishProgress(tx, updated);
    return (await getLearningSession(row.id, params.childProfileId, tx))!;
  }, transaction);
}

export interface AttemptInput { sessionId: string; childProfileId: string; questionId: string; optionId: string; latencyMs: number; idempotencyKey: string }
export async function submitLearningAttempt(params: AttemptInput, transaction?: Transaction): Promise<AttemptResultDTO> {
  return childTransaction(params.childProfileId, async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`learning-attempt:${params.idempotencyKey}`}, 0))`);
    const existing = (await tx.select().from(attempts).where(eq(attempts.idempotencyKey, params.idempotencyKey)))[0];
    const session = (await tx.select().from(sessions).where(and(eq(sessions.id, params.sessionId), eq(sessions.childProfileId, params.childProfileId))))[0];
    if (!session) throw new AppError("SESSION_NOT_FOUND", 404);
    const stageQuestions = await getStageQuestions(session.stageId, tx);
    const question = stageQuestions.find(row => row.id === params.questionId);
    if (!question) throw new AppError("QUESTION_NOT_FOUND", 404);
    const selectedIndex = questionToDto(question).options.findIndex(option => option.id === params.optionId);
    if (selectedIndex < 0) throw new AppError("INVALID_OPTION", 400);
    if (existing) {
      if (!sameAttempt(existing, params) || existing.selectedIndex !== selectedIndex || existing.latencyMs !== params.latencyMs) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
      return attemptResult(existing.correct, question, session, stageQuestions);
    }
    if (session.endedAt) throw new AppError("SESSION_COMPLETED", 409);
    if (stageQuestions[session.currentIndex]?.id !== params.questionId) throw new AppError("QUESTION_OUT_OF_ORDER", 409);
    const correct = selectedIndex === question.correctIndex;
    const answeredAt = new Date();
    const row = (await tx.insert(attempts).values({ id: newId(), ...params, correct, selectedIndex, answeredAt }).returning())[0];
    const previous = (await tx.select().from(proficiencies).where(and(eq(proficiencies.childProfileId, params.childProfileId), eq(proficiencies.targetWord, question.targetWord))))[0];
    const mastery = updateProficiency(previous ? { ...previous, p: Number(previous.p), lastSeenAt: previous.lastSeenAt.getTime() } : null, correct);
    const firstMasteredAt = previous?.firstMasteredAt ?? (Number(mastery.p.toFixed(4)) >= 0.7 && (!previous || Number(previous.p) < 0.7) ? answeredAt : null);
    const values = { p: mastery.p.toFixed(4), attempts: mastery.attempts, lastSeenAt: new Date(mastery.lastSeenAt), firstMasteredAt };
    const proficiency = previous ? (await tx.update(proficiencies).set(values).where(eq(proficiencies.id, previous.id)).returning())[0] :
      (await tx.insert(proficiencies).values({ id: newId(), childProfileId: params.childProfileId, targetWord: question.targetWord, ...values }).returning())[0];
    if (firstMasteredAt && !previous?.firstMasteredAt) await tx.update(childProfiles).set({ wordCount: sql`${childProfiles.wordCount} + 1` }).where(eq(childProfiles.id, params.childProfileId));
    const updated = (await tx.update(sessions).set({ currentIndex: session.currentIndex + 1, earnedStars: session.earnedStars + (correct ? 1 : 0), version: session.version + 1 }).where(eq(sessions.id, session.id)).returning())[0];
    const profile = (await tx.select().from(childProfiles).where(eq(childProfiles.id, params.childProfileId)))[0];
    const day = Math.floor(answeredAt.getTime() / 86400000);
    const lastDay = profile.lastActiveAt ? Math.floor(profile.lastActiveAt.getTime() / 86400000) : null;
    const streak = lastDay === day ? Math.max(1, profile.streak) : lastDay === day - 1 ? profile.streak + 1 : 1;
    await tx.update(childProfiles).set({ lastActiveAt: answeredAt, status: "active", streak }).where(eq(childProfiles.id, params.childProfileId));
    if (correct) await creditStars(tx, params.childProfileId, 1);
    await recordSyncChange(tx, { childProfileId: params.childProfileId, entity: "attempts", entityId: params.idempotencyKey, op: "insert",
      payload: { ...row, answeredAt: answeredAt.getTime(), optionId: params.optionId, targetWord: question.targetWord } });
    await recordSyncChange(tx, { childProfileId: params.childProfileId, entity: "proficiencies", entityId: proficiency.id, op: previous ? "update" : "insert",
      payload: { targetWord: question.targetWord, p: Number(proficiency.p), attempts: proficiency.attempts, lastSeenAt: proficiency.lastSeenAt.getTime() } });
    await recordSyncChange(tx, { childProfileId: params.childProfileId, entity: "sessions", entityId: session.id, op: "update", payload: sessionPayload(updated) });
    return attemptResult(correct, question, updated, stageQuestions);
  }, transaction);
}

function attemptResult(correct: boolean, question: typeof questions.$inferSelect, session: typeof sessions.$inferSelect, stageQuestions: typeof questions.$inferSelect[]): AttemptResultDTO {
  const dto = questionToDto(question);
  return { correct, questionId: question.id, targetWord: dto.targetWord, translation: dto.translation,
    correctOption: dto.options[question.correctIndex], earnedStars: session.earnedStars,
    sessionComplete: !!session.endedAt || session.currentIndex >= session.totalQuestions,
    nextQuestion: stageQuestions[session.currentIndex] ? questionToDto(stageQuestions[session.currentIndex]) : null };
}

export async function completeLearningSession(sessionId: string, childProfileId: string, transaction?: Transaction) {
  return childTransaction(childProfileId, async tx => {
    let session = (await tx.select().from(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.childProfileId, childProfileId))))[0];
    if (!session) throw new AppError("SESSION_NOT_FOUND", 404);
    if (session.currentIndex < session.totalQuestions) throw new AppError("SESSION_INCOMPLETE", 409);
    const answers = await tx.select().from(attempts).where(eq(attempts.sessionId, sessionId));
    const correctCount = answers.filter(item => item.correct).length;
    if (!session.endedAt) {
      const stage = (await tx.select().from(stages).where(eq(stages.id, session.stageId)))[0];
      const endedAt = new Date();
      await creditStars(tx, childProfileId, stage.pointsReward);
      session = (await tx.update(sessions).set({ endedAt, durationSec: Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)),
        earnedStars: session.earnedStars + stage.pointsReward, version: session.version + 1 }).where(eq(sessions.id, session.id)).returning())[0];
      const progress = (await tx.update(stageProgress).set({ status: "completed", completedStars: stage.pointsReward, version: sql`${stageProgress.version} + 1`, updatedAt: endedAt })
        .where(and(eq(stageProgress.childProfileId, childProfileId), eq(stageProgress.stageId, stage.id))).returning())[0];
      if (!progress) throw new Error("儿童关卡进度缺失");
      await publishProgress(tx, progress);
      const nextStage = (await tx.select().from(stages).where(and(eq(stages.unitId, stage.unitId), eq(stages.order, stage.order + 1))))[0];
      if (nextStage) {
        const next = (await tx.update(stageProgress).set({ status: "unlocked", version: sql`${stageProgress.version} + 1`, updatedAt: endedAt })
          .where(and(eq(stageProgress.childProfileId, childProfileId), eq(stageProgress.stageId, nextStage.id), eq(stageProgress.status, "locked"))).returning())[0];
        if (next) await publishProgress(tx, next);
      }
      await recordSyncChange(tx, { childProfileId, entity: "sessions", entityId: session.id, op: "update", payload: sessionPayload(session) });
    }
    const acquired = await tx.select({ word: proficiencies.targetWord }).from(proficiencies).where(and(eq(proficiencies.childProfileId, childProfileId),
      sql`${proficiencies.firstMasteredAt} >= ${session.startedAt}`, sql`${proficiencies.firstMasteredAt} <= ${session.endedAt}`));
    return { score: session.totalQuestions ? Math.round(correctCount / session.totalQuestions * 100) : 0, earnedStars: session.earnedStars,
      newWords: acquired.length, rewardVisual: "⭐", rewardName: "通关星星" };
  }, transaction);
}

function sessionPayload(row: typeof sessions.$inferSelect) {
  return { stageId: row.stageId, startedAt: row.startedAt.getTime(), endedAt: row.endedAt?.getTime() ?? null,
    durationSec: row.durationSec, currentIndex: row.currentIndex, totalQuestions: row.totalQuestions, earnedStars: row.earnedStars };
}
async function publishProgress(tx: Transaction, row: typeof stageProgress.$inferSelect) {
  await recordSyncChange(tx, { childProfileId: row.childProfileId, entity: "stage_progress", entityId: row.id, op: "update",
    payload: { stageId: row.stageId, status: row.status, completedStars: row.completedStars, updatedAt: row.updatedAt.getTime() } });
}
