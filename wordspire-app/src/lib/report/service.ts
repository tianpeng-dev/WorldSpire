import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, type DatabaseExecutor } from "../db";
import { attempts, childProfiles, learningReports, proficiencies, sessions } from "../db/schema";
import { newId } from "../utils";
import { getEnv } from "../config/env";
import { AppError } from "../http/errors";
import { logger } from "../http/logger";

export function weekStart(now = new Date()): Date {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date;
}
export async function buildWeeklyReportData(childProfileId: string, start = new Date(Date.now() - 7 * 86400000), end = new Date(), executor: DatabaseExecutor = db) {
  const sessionRows = await executor.select({ seconds: sql<string>`coalesce(sum(${sessions.durationSec}), 0)` }).from(sessions)
    .where(and(eq(sessions.childProfileId, childProfileId), gte(sessions.startedAt, start), lt(sessions.startedAt, end)));
  const answers = await executor.select({ total: count(), correct: sql<string>`coalesce(sum(case when ${attempts.correct} then 1 else 0 end), 0)` }).from(attempts)
    .where(and(eq(attempts.childProfileId, childProfileId), gte(attempts.answeredAt, start), lt(attempts.answeredAt, end)));
  const words = await executor.select({ count: count() }).from(proficiencies)
    .where(and(eq(proficiencies.childProfileId, childProfileId), gte(proficiencies.firstMasteredAt, start), lt(proficiencies.firstMasteredAt, end)));
  const profile = (await executor.select().from(childProfiles).where(eq(childProfiles.id, childProfileId)))[0];
  if (!profile) throw new AppError("CHILD_NOT_FOUND", 404);
  return { newWords: words[0].count, totalTimeMin: Math.floor(Number(sessionRows[0].seconds) / 60),
    accuracy: answers[0].total ? Number(answers[0].correct) / answers[0].total : 0, streak: profile.streak, attemptCount: answers[0].total };
}
export type ReportData = Awaited<ReturnType<typeof buildWeeklyReportData>>;
export function templateSummary(data: Pick<ReportData, "newWords" | "totalTimeMin" | "accuracy" | "streak"> & { attemptCount?: number }): string {
  if (data.attemptCount === 0) return `本周暂无答题记录，已记录学习 ${data.totalTimeMin} 分钟，新增 ${data.newWords} 个词。`;
  return `本周学习 ${data.totalTimeMin} 分钟，新增 ${data.newWords} 个词，答题准确率 ${Math.round(data.accuracy * 100)}%，连续学习 ${data.streak} 天。`;
}
export async function generateAiSummary(data: Pick<ReportData, "newWords" | "totalTimeMin" | "accuracy" | "streak">): Promise<string> { return templateSummary(data); }
export async function generateLlmSummary(data: ReportData): Promise<string> {
  const env = getEnv();
  if (!env.LLM_API_KEY || !env.LLM_BASE_URL || !env.LLM_MODEL) throw new AppError("LLM_NOT_CONFIGURED", 503);
  const response = await fetch(new URL("chat/completions", env.LLM_BASE_URL.endsWith("/") ? env.LLM_BASE_URL : `${env.LLM_BASE_URL}/`), {
    method: "POST", headers: { Authorization: `Bearer ${env.LLM_API_KEY}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ model: env.LLM_MODEL, messages: [{ role: "system", content: "根据提供的实际统计，用中文写一段简短的儿童英语学习周报。不得添加没有记录支持的指标。" }, { role: "user", content: JSON.stringify(data) }] }),
  });
  if (!response.ok) throw new AppError("LLM_UNAVAILABLE", 503, `摘要服务响应 ${response.status}`);
  const parsed = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().min(1).max(4000) }) })).min(1) }).parse(await response.json());
  return parsed.choices[0].message.content;
}
export async function reportSummary(data: ReportData) {
  if (!getEnv().LLM_API_KEY) return { text: templateSummary(data), source: "template" };
  try { return { text: await generateLlmSummary(data), source: "llm" }; }
  catch (error) {
    if (!(error instanceof AppError) && !(error instanceof z.ZodError) && !(error instanceof TypeError) && !(error instanceof DOMException)) throw error;
    logger.error({ err: error }, "周报摘要服务失败，使用规则模板生成摘要");
    return { text: templateSummary(data), source: "template" };
  }
}
export async function saveWeeklyReport(childProfileId: string, data: ReportData, periodStart: Date, summary: { text: string; source: string }, executor: DatabaseExecutor = db) {
  const report = (await executor.insert(learningReports).values({ id: newId(), childProfileId, period: "week", periodStart,
    newWords: data.newWords, totalTimeMin: data.totalTimeMin, accuracy: data.accuracy.toFixed(4), streak: data.streak, aiSummary: summary.text, summarySource: summary.source })
    .onConflictDoUpdate({ target: [learningReports.childProfileId, learningReports.period, learningReports.periodStart],
      set: { newWords: data.newWords, totalTimeMin: data.totalTimeMin, accuracy: data.accuracy.toFixed(4), streak: data.streak, aiSummary: summary.text, summarySource: summary.source, generatedAt: new Date() } }).returning())[0];
  return report.id;
}
export async function getLatestReport(childProfileId: string) {
  return (await db.select().from(learningReports).where(eq(learningReports.childProfileId, childProfileId)).orderBy(desc(learningReports.generatedAt)).limit(1))[0] ?? null;
}
