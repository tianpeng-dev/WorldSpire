import { timingSafeEqual } from "node:crypto";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db, type Transaction } from "../db";
import { childProfiles, cronAttempts, cronRuns, guardianLinks, users } from "../db/schema";
import { getEnv } from "../config/env";
import { AppError } from "../http/errors";
import { cleanMessage, logger } from "../http/logger";
import { newId } from "../utils";
import { buildWeeklyReportData, reportSummary, saveWeeklyReport, weekStart } from "../report/service";
import { sendAtRiskNotification, sendWeeklyReportNotification } from "../push/service";

export function requireCron(request: Request): void {
  const expected = Buffer.from(`Bearer ${getEnv().CRON_SECRET}`);
  const incoming = Buffer.from(request.headers.get("authorization") ?? "");
  if (incoming.length !== expected.length || !timingSafeEqual(incoming, expected)) throw new AppError("UNAUTHORIZED", 401);
}
export async function runCron(task: string, periodKey: string, work: (tx: Transaction) => Promise<Record<string, number>>) {
  const run = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${task}:${periodKey}`}))`);
    const row = (await tx.select().from(cronRuns).where(and(eq(cronRuns.task, task), eq(cronRuns.periodKey, periodKey))).for("update"))[0];
    if (row?.status === "completed") return null;
    if (row?.status === "running" && row.startedAt.getTime() > Date.now() - 10 * 60000) throw new AppError("CRON_RUNNING", 409);
    if (row?.status === "running") await tx.update(cronAttempts).set({ status: "failed", completedAt: new Date(), error: "执行租约已过期" })
      .where(and(eq(cronAttempts.runId, row.id), eq(cronAttempts.status, "running")));
    const current = row ? (await tx.update(cronRuns).set({ status: "running", startedAt: new Date(), completedAt: null, error: null }).where(eq(cronRuns.id, row.id)).returning())[0] :
      (await tx.insert(cronRuns).values({ id: newId(), task, periodKey, status: "running", startedAt: new Date() }).returning())[0];
    const attemptId = newId();
    await tx.insert(cronAttempts).values({ id: attemptId, runId: current.id, status: "running" });
    return { ...current, attemptId };
  });
  if (!run) return { repeated: true };
  try {
    return await db.transaction(async tx => {
      const current = (await tx.select().from(cronRuns).where(eq(cronRuns.id, run.id)).for("update"))[0];
      if (current.startedAt.getTime() !== run.startedAt.getTime() || current.status !== "running") throw new AppError("CRON_LEASE_LOST", 409);
      const result = await work(tx);
      await tx.update(cronRuns).set({ status: "completed", completedAt: new Date() }).where(eq(cronRuns.id, run.id));
      await tx.update(cronAttempts).set({ status: "completed", completedAt: new Date() }).where(eq(cronAttempts.id, run.attemptId));
      return { repeated: false, ...result };
    });
  } catch (error) {
    logger.error({ err: error, task, runId: run.id }, "定时任务失败");
    const failure = (error instanceof Error ? `${cleanMessage(error.message)}${error.cause instanceof Error ? `; ${cleanMessage(error.cause.message)}` : ""}` : cleanMessage(String(error))).slice(0, 2000);
    await db.transaction(async tx => {
      const current = (await tx.select().from(cronRuns).where(eq(cronRuns.id, run.id)).for("update"))[0];
      if (current.status === "running" && current.startedAt.getTime() === run.startedAt.getTime()) {
        await tx.update(cronRuns).set({ status: "failed", completedAt: new Date(), error: failure }).where(eq(cronRuns.id, run.id));
      }
      await tx.update(cronAttempts).set({ status: "failed", completedAt: new Date(), error: failure }).where(eq(cronAttempts.id, run.attemptId));
    });
    throw error;
  }
}
export async function weeklyReports() {
  const end = weekStart();
  const start = new Date(end.getTime() - 7 * 86400000);
  return runCron("weekly-report", start.toISOString(), async tx => {
    const children = await tx.select().from(childProfiles).where(inArray(childProfiles.status, ["active", "at_risk"]));
    let queued = 0;
    for (const child of children) {
      const data = await buildWeeklyReportData(child.id, start, end, tx);
      await saveWeeklyReport(child.id, data, start, await reportSummary(data), tx);
      const links = await tx.select().from(guardianLinks).where(and(eq(guardianLinks.childProfileId, child.id), eq(guardianLinks.status, "active")));
      await sendWeeklyReportNotification(links.map(link => link.guardianUserId), child.id, tx);
      queued += links.length;
    }
    return { reports: children.length, queued };
  });
}
export async function scanRisk() {
  return runCron("risk-scan", new Date().toISOString().slice(0, 10), async tx => {
    const children = await tx.select({ child: childProfiles }).from(childProfiles).innerJoin(users, eq(users.id, childProfiles.userId))
      .where(and(inArray(childProfiles.status, ["active", "activating"]), sql`coalesce(${childProfiles.lastActiveAt}, ${users.createdAt}) < ${new Date(Date.now() - 5 * 86400000)}`));
    let queued = 0;
    for (const { child } of children) {
      const updated = await tx.update(childProfiles).set({ status: "at_risk" }).where(and(eq(childProfiles.id, child.id),
        or(lt(childProfiles.lastActiveAt, new Date(Date.now() - 5 * 86400000)), sql`${childProfiles.lastActiveAt} is null`))).returning();
      if (!updated.length) continue;
      const links = await tx.select().from(guardianLinks).where(and(eq(guardianLinks.childProfileId, child.id), eq(guardianLinks.status, "active")));
      for (const link of links) { await sendAtRiskNotification(link.guardianUserId, child.id, tx); queued++; }
    }
    return { atRisk: children.length, queued };
  });
}
