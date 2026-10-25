import { asc, and, eq, gte } from "drizzle-orm";
import { db, type DatabaseExecutor } from "@/lib/db";
import { attempts, childProfiles, collectionItems, proficiencies, questions, sessions, stages, stageProgress, starWallets, users } from "@/lib/db/schema";
import type { ChildOverviewDTO, CollectionDTO, CollectionEntryDTO, LearningSessionDTO, QuestionDTO, StageStatus, StageSummaryDTO } from "@/types";
import { COLLECTION_SEED, FRUIT_OPTIONS, FRUIT_TRANSLATIONS } from "./seed";

function stageDescription(status: StageStatus, order: number, completedStars: number): string {
  if (status === "completed") return `已完成 · 获得 ${completedStars} 星`;
  if (status === "in_progress") return "进行中 · 点击继续";
  if (status === "unlocked") return "已解锁 · 点击开始";
  return `未解锁 · 通关第 ${Math.max(1, order - 1)} 关开启`;
}

export async function getChildOverview(childProfileId: string): Promise<ChildOverviewDTO> {
  const row = (await db.select({ profile: childProfiles, user: users }).from(childProfiles)
    .innerJoin(users, eq(childProfiles.userId, users.id)).where(eq(childProfiles.id, childProfileId)).limit(1))[0];
  if (!row) throw new Error("CHILD_NOT_FOUND");
  const wallet = (await db.select().from(starWallets).where(eq(starWallets.childProfileId, childProfileId)))[0];
  if (!wallet) throw new Error("儿童钱包缺失");
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const todayRows = await db.select({ id: attempts.id }).from(attempts).where(and(eq(attempts.childProfileId, childProfileId), gte(attempts.answeredAt, todayStart)));
  const weekRows = await db.select({ correct: attempts.correct }).from(attempts).where(and(eq(attempts.childProfileId, childProfileId), gte(attempts.answeredAt, weekStart)));
  const newWords = await db.select({ id: proficiencies.id }).from(proficiencies).where(and(eq(proficiencies.childProfileId, childProfileId), gte(proficiencies.firstMasteredAt, weekStart)));
  const progressRows = await db.select({ progress: stageProgress }).from(stageProgress).innerJoin(stages, eq(stages.id, stageProgress.stageId))
    .where(eq(stageProgress.childProfileId, childProfileId)).orderBy(asc(stages.order));
  const current = progressRows.find(({ progress }) => progress.status === "in_progress" || progress.status === "unlocked")?.progress;
  return { child: { id: row.profile.id, nickname: row.user.nickname, level: row.profile.level, wordCount: row.profile.wordCount,
    streak: row.profile.streak, status: row.profile.status as ChildOverviewDTO["child"]["status"] },
    wallet: { balance: wallet.balance, totalEarned: wallet.totalEarned }, today: { completed: Math.min(todayRows.length, 5), total: 5 },
    weekly: { newWords: newWords.length, accuracy: weekRows.length ? weekRows.filter(item => item.correct).length / weekRows.length : null },
    currentStageId: current?.stageId ?? null };
}

export async function listChildStages(childProfileId: string): Promise<StageSummaryDTO[]> {
  const rows = await db.select({ stage: stages, progress: stageProgress }).from(stages)
    .leftJoin(stageProgress, and(eq(stageProgress.stageId, stages.id), eq(stageProgress.childProfileId, childProfileId))).orderBy(asc(stages.order));
  return rows.map(({ stage, progress }) => {
    const status = (progress?.status ?? "locked") as StageStatus;
    return { ...stage, status, completedStars: progress?.completedStars ?? 0, description: stageDescription(status, stage.order, progress?.completedStars ?? 0) };
  });
}

function optionId(label: string): string { return FRUIT_OPTIONS.find(option => option.label === label)?.id ?? label.toLowerCase(); }
export function questionToDto(question: typeof questions.$inferSelect): QuestionDTO {
  return { id: question.id, stageId: question.stageId, targetWord: question.targetWord,
    translation: FRUIT_TRANSLATIONS[question.targetWord.toLowerCase()]?.translation ?? question.targetWord,
    promptAudioUrl: question.promptAudioUrl,
    options: question.options.map(label => ({ id: optionId(label), visual: FRUIT_TRANSLATIONS[optionId(label)]?.visual ?? "❓", label })) };
}
export async function getStageQuestions(stageId: string, executor: DatabaseExecutor = db) {
  return executor.select().from(questions).where(eq(questions.stageId, stageId)).orderBy(asc(questions.id));
}
export async function getLearningSession(sessionId: string, childProfileId: string, executor: DatabaseExecutor = db): Promise<LearningSessionDTO | null> {
  const session = (await executor.select().from(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.childProfileId, childProfileId))).limit(1))[0];
  if (!session) return null;
  const stageQuestions = await getStageQuestions(session.stageId, executor);
  const current = stageQuestions[session.currentIndex];
  return { id: session.id, stageId: session.stageId, currentIndex: session.currentIndex, totalQuestions: session.totalQuestions,
    earnedStars: session.earnedStars, question: current ? questionToDto(current) : null };
}
export async function getCollection(childProfileId: string): Promise<CollectionDTO> {
  const unlockedRows = await db.select().from(collectionItems).where(eq(collectionItems.childProfileId, childProfileId));
  const unlocked = new Set(unlockedRows.map(row => `${row.kind}:${row.itemKey}`));
  const wallet = (await db.select().from(starWallets).where(eq(starWallets.childProfileId, childProfileId)))[0];
  if (!wallet) throw new Error("儿童钱包缺失");
  const toEntry = (item: typeof COLLECTION_SEED[number]): CollectionEntryDTO => ({ ...item, unlocked: unlocked.has(`${item.kind}:${item.itemKey}`) });
  return { balance: wallet.balance, characters: COLLECTION_SEED.filter(item => item.kind === "character").map(toEntry), badges: COLLECTION_SEED.filter(item => item.kind === "badge").map(toEntry) };
}
export function collectionSeedEntry(itemKey: string) { return COLLECTION_SEED.find(item => item.itemKey === itemKey) ?? null; }
