"use client";

import { useEffect, useState } from "react";
import {
  ChildShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  WSCard,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo } from "@/lib/child/api";
import { DEMO_REPORT } from "@/lib/child/catalog";
import type { ReportDTO } from "@/types";

export default function ReportPage() {
  const { ready, demo } = useChildQuery();
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    void apiOrDemo<{ report?: ReportDTO } | ReportDTO>("/api/report", DEMO_REPORT, demo)
      .then((payload) => setReport("report" in payload && payload.report ? payload.report : payload as ReportDTO))
      .catch(() => setError("报告还在路上，请再试一次。"));
  }, [demo, ready]);

  if (!ready || (!report && !error)) return <ChildShell active="home"><LoadingState label="正在整理你的学习报告…" /></ChildShell>;
  if (error) return <ChildShell active="home"><ErrorState message={error} /></ChildShell>;
  if (!report || report.status === "empty") return <ChildShell active="home"><PageHeader title="学习报告" backHref={addDemoQuery("/child", demo)} /><EmptyState message="完成一次闯关后，这里就会出现你的学习报告。" /></ChildShell>;
  if (report.status === "generating") return <ChildShell active="home"><PageHeader title="学习报告" backHref={addDemoQuery("/child", demo)} /><LoadingState label="小塔正在生成报告…" /></ChildShell>;

  return (
    <ChildShell active="home">
      <section className="report" aria-label="学习报告">
        <PageHeader title="学习报告" backHref={addDemoQuery("/child", demo)} />
        <WSCard className="report-section-card">
          <h2 className="report-section-title">本周总览</h2>
          <div className="report-overview">
            <WSCard className="report-stat-card"><p className="report-stat-label">新词</p><p className="report-stat-value">{report.overview.newWords}</p></WSCard>
            <WSCard className="report-stat-card"><p className="report-stat-label">准确率</p><p className="report-stat-value">{report.overview.accuracy === null ? "暂无记录" : `${Math.round(report.overview.accuracy * 100)}%`}</p></WSCard>
            <WSCard className="report-stat-card"><p className="report-stat-label">连胜</p><p className="report-stat-value">{report.overview.streak} 天</p></WSCard>
            <WSCard className="report-stat-card"><p className="report-stat-label">星星</p><p className="report-stat-value">{report.overview.stars}</p></WSCard>
          </div>
          <p className="report-summary" style={{ marginTop: 20 }}>{report.summary}</p>
        </WSCard>

        <WSCard className="report-section-card">
          <h2 className="report-section-title">能力趋势</h2>
          {report.abilities.map((ability) => (
            <div className="report-ability-item" key={ability.key}>
              <div className="report-ability-header"><span>{ability.label}</span><span className="report-ability-value">{Math.round(ability.value * 100)}%</span></div>
              <ProgressBar value={ability.value} />
            </div>
          ))}
        </WSCard>

        <WSCard className="report-section-card">
          <h2 className="report-section-title">最近成就</h2>
          <div className="report-achievements">
            {report.achievements.map((achievement) => (
              <div className="report-achievement" key={achievement.key}><span className="report-achievement-icon" aria-hidden="true">{achievement.visual}</span>{achievement.label}</div>
            ))}
          </div>
        </WSCard>

        <WSCard>
          <h2 className="report-section-title">学习时长</h2>
          <div className="report-ability-header"><span>本周累计</span><span className="report-ability-value">{report.totalTimeMin} 分钟</span></div>
          <ProgressBar value={Math.min(report.totalTimeMin / 180, 1)} label="目标 180 分钟" />
        </WSCard>
      </section>
    </ChildShell>
  );
}
