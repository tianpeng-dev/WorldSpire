"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  StarBadge,
  WSCard,
  WSLinkButton,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo } from "@/lib/child/api";
import { DEMO_OVERVIEW } from "@/lib/child/catalog";
import type { ChildOverviewDTO } from "@/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 13) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export default function ChildHomePage() {
  const { ready, demo } = useChildQuery();
  const [overview, setOverview] = useState<ChildOverviewDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    setError(null);
    void apiOrDemo<{ overview?: ChildOverviewDTO } | ChildOverviewDTO>(
      "/api/child/overview",
      DEMO_OVERVIEW,
      demo,
    )
      .then((payload) => {
        const next = "overview" in payload && payload.overview ? payload.overview : payload as ChildOverviewDTO;
        if (!next) throw new Error("EMPTY_OVERVIEW");
        setOverview(next);
      })
      .catch(() => setError("首页数据暂时没有准备好，请再试一次。"));
  }, [demo, ready]);

  if (!ready || (!overview && !error)) {
    return <ChildShell active="home"><LoadingState label="正在打开词灵塔…" /></ChildShell>;
  }

  if (error || !overview) {
    return <ChildShell active="home"><ErrorState message={error ?? undefined} /></ChildShell>;
  }

  const { child, wallet, today, weekly } = overview;
  const mapHref = addDemoQuery("/child/map", demo);
  const battleHref = addDemoQuery("/child/battle", demo);
  const reportHref = addDemoQuery("/child/report", demo);
  const progress = today.total ? today.completed / today.total : 0;

  return (
    <ChildShell active="home">
      <section className="home" aria-label="首页">
        <header className="home-header">
          <div>
            <p className="home-greeting">{greeting()}，{child.nickname}</p>
            <h1 className="ws-title home-title">词灵塔</h1>
          </div>
          <div className="home-badges">
            <StarBadge> {child.streak} 天连胜</StarBadge>
            <StarBadge> {wallet.balance} 星</StarBadge>
            <Link href={reportHref} className="home-profile-btn" aria-label="查看学习报告">
              <UserRound aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="home-mobile-layout">
          <div className="ws-hero home-hero" data-dom-id="home-hero">
            <img src="/assets/hero-wordspire-storybook.jpg" alt="词灵塔主题插画" fetchPriority="high" />
          </div>
          <div className="home-actions" aria-label="快捷操作">
            <WSLinkButton href={mapHref}>继续闯关</WSLinkButton>
            <WSLinkButton href={battleHref} variant="secondary">去对战</WSLinkButton>
          </div>
        </div>

        <div className="home-desktop-layout">
          <div className="ws-hero home-hero" data-dom-id="home-hero-desktop">
            <img src="/assets/hero-wordspire-storybook.jpg" alt="今日主题" />
          </div>
          <WSCard className="home-task-card">
            <div className="home-task-header">
              <h2 className="home-task-title">今日任务</h2>
              <span className="home-task-count">{today.completed}/{today.total} 完成</span>
            </div>
            <div className="ws-progress-bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="今日任务进度">
              <div className="fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="home-task-actions">
              <WSLinkButton href={mapHref}>继续闯关</WSLinkButton>
              <WSLinkButton href={battleHref} variant="secondary">去对战</WSLinkButton>
            </div>
          </WSCard>
          <div className="home-stats">
            <WSCard>
              <p className="home-stat-label">本周新词</p>
              <p className="home-stat-value">{weekly.newWords}</p>
            </WSCard>
            <WSCard>
              <p className="home-stat-label">拼读准确率</p>
              <p className="home-stat-value">{weekly.accuracy === null ? "暂无记录" : `${Math.round(weekly.accuracy * 100)}%`}</p>
            </WSCard>
          </div>
        </div>

        <WSCard className="home-mobile-task home-task-card">
          <div className="home-task-header">
            <h2 className="home-task-title">今日任务</h2>
            <span className="home-task-count">{today.completed}/{today.total} 完成</span>
          </div>
          <div className="ws-progress-bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="今日任务进度">
            <div className="fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </WSCard>
      </section>
    </ChildShell>
  );
}
