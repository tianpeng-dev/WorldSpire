"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChildShell, LoadingState, WSCard } from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest } from "@/lib/child/api";

type CompleteResult = { score: number; earnedStars: number; newWords: number; rewardVisual: string; rewardName: string };

const DEMO_RESULT: CompleteResult = { score: 80, earnedStars: 5, newWords: 3, rewardVisual: "🍎", rewardName: "小苹果" };

export default function CompletePage() {
  const { ready, demo, params } = useChildQuery();
  const [result, setResult] = useState<CompleteResult | null>(demo ? DEMO_RESULT : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !params || demo) return;
    const sessionId = params.get("sessionId");
    if (!sessionId) {
      setResult(DEMO_RESULT);
      return;
    }
    void apiRequest<{ result?: CompleteResult }>(`/api/learning/sessions/${encodeURIComponent(sessionId)}/complete`, { method: "POST" })
      .then((payload) => setResult(payload.result ?? DEMO_RESULT))
      .catch(() => setError("结算暂时没有完成，请稍后再试。"));
  }, [demo, params, ready]);

  useEffect(() => {
    if (ready && demo) setResult(DEMO_RESULT);
  }, [demo, ready]);

  if (!ready || (!result && !error)) return <ChildShell active="map"><LoadingState label="小塔正在结算奖励…" /></ChildShell>;
  if (error) return <ChildShell active="map"><div className="ws-state-panel ws-state-panel-error" role="alert"><p>{error}</p></div></ChildShell>;
  if (!result) return null;

  return (
    <ChildShell active="map">
      <section className="complete-page" aria-label="关卡结算">
        <h1 className="ws-title" style={{ fontSize: "42px" }}>关卡完成！</h1>
        <div className="ws-hero complete-hero">
          <img src="/assets/mascot-word-spirit.jpg" alt="小塔" />
        </div>
        <div className="complete-stats">
          <WSCard className="complete-stat"><p className="complete-stat-label">得分</p><p className="complete-stat-value">{result.score}</p></WSCard>
          <WSCard className="complete-stat"><p className="complete-stat-label">星星</p><p className="complete-stat-value">+{result.earnedStars}</p></WSCard>
          <WSCard className="complete-stat"><p className="complete-stat-label">新词</p><p className="complete-stat-value">{result.newWords}</p></WSCard>
        </div>
        <WSCard className="complete-reward">
          <div className="complete-reward-visual" aria-hidden="true">{result.rewardVisual}</div>
          <div>
            <p className="complete-reward-title">解锁角色：{result.rewardName}</p>
            <p className="complete-reward-note">已加入你的收藏</p>
          </div>
        </WSCard>
        <div className="complete-actions">
          <Link className="ws-button" href={addDemoQuery("/child/map", demo)}>下一关</Link>
          <Link className="ws-button ws-button-secondary" href={addDemoQuery("/child/battle", demo)}>去对战</Link>
        </div>
      </section>
    </ChildShell>
  );
}
