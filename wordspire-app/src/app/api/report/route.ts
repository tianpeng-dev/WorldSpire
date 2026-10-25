import { requireChildAccess, requireChildSession } from "@/lib/auth/session";
import { getChildOverview } from "@/lib/child/server";
import { buildWeeklyReportData, getLatestReport, templateSummary } from "@/lib/report/service";
import { route } from "@/lib/http/route";
import type { ReportDTO } from "@/types";
export const runtime = "nodejs";
export const GET = route(async request => {
  let childProfileId = new URL(request.url).searchParams.get("childProfileId");
  if (childProfileId) await requireChildAccess(childProfileId, request);
  else childProfileId = (await requireChildSession(request)).childProfileId;
  const overview = await getChildOverview(childProfileId);
  const stored = await getLatestReport(childProfileId);
  const start = stored ? stored.periodStart ?? new Date(stored.generatedAt.getTime() - 7 * 86400000) : undefined;
  const end = stored ? stored.periodStart ? new Date(stored.periodStart.getTime() + 7 * 86400000) : stored.generatedAt : undefined;
  const observed = await buildWeeklyReportData(childProfileId, start, end);
  const data = stored ? { ...stored, accuracy: Number(stored.accuracy), attemptCount: observed.attemptCount } : observed;
  const ready = data.attemptCount > 0 || data.newWords > 0 || data.totalTimeMin > 0;
  const report: ReportDTO = { status: ready ? "ready" : "empty", summary: ready ? stored?.aiSummary || templateSummary(data) : "完成一次闯关后，这里就会出现你的学习报告。",
    overview: { newWords: data.newWords, accuracy: data.attemptCount ? data.accuracy : null, streak: data.streak, stars: overview.wallet.balance },
    abilities: [], achievements: [], totalTimeMin: data.totalTimeMin };
  return Response.json({ report });
});
