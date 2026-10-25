"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChildShell, LoadingState, WSCard } from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest } from "@/lib/child/api";
import { DEMO_BATTLE_RESULT } from "@/lib/child/catalog";
import type { BattleDTO } from "@/types";

export default function BattleResultPage() {
  const { ready, demo, params } = useChildQuery();
  const [battle, setBattle] = useState<BattleDTO | null>(demo ? DEMO_BATTLE_RESULT : null);
  const [error, setError] = useState<string | null>(null);
  const battleId = params?.get("battleId") ?? "demo-battle";

  useEffect(() => {
    if (!ready || !params || demo) return;
    void apiRequest<BattleDTO | { battle: BattleDTO }>(`/api/battle/${encodeURIComponent(battleId)}`)
      .then((payload) => setBattle("battle" in payload ? payload.battle : payload))
      .catch(() => setError("对战结果暂时没有读到，请稍后再试。"));
  }, [battleId, demo, params, ready]);

  useEffect(() => {
    if (ready && demo) setBattle(params?.get("mode") === "parent_async" ? { ...DEMO_BATTLE_RESULT, mode: "parent_async", opponentName: "妈妈" } : DEMO_BATTLE_RESULT);
  }, [demo, params, ready]);

  if (!ready || (!battle && !error)) return <ChildShell active="battle"><LoadingState label="正在整理对战结果…" /></ChildShell>;
  if (error || !battle) return <ChildShell active="battle"><div className="ws-state-panel ws-state-panel-error" role="alert"><p>{error ?? "结果为空"}</p></div></ChildShell>;

  const won = battle.winnerId === "demo-child" || (battle.winnerId !== null && battle.winnerId !== "bot_xiaota");
  const scoreline = `${battle.childName} ${battle.childScore} : ${battle.opponentScore} ${battle.opponentName}`;
  return (
    <ChildShell active="battle">
      <section className="result-page" aria-label="对战结算">
        <div className="result-trophy" aria-hidden="true">🏆</div>
        <h1 className="ws-title">{won ? "你赢了！" : "再接再厉！"}</h1>
        <p className="result-scoreline">{scoreline}</p>
        <div className="result-stats">
          <WSCard><p className="result-stat-label">对战结果</p><p className="result-stat-value">{won ? "获胜" : battle.winnerId === null ? "平局" : "结束"}</p></WSCard>
          <WSCard><p className="result-stat-label">获得星星</p><p className="result-stat-value">{won ? "+10" : "0"}</p></WSCard>
        </div>
        <WSCard className="result-rank">
          <p className="result-rank-title">{battle.rank === null ? "暂无排名" : `本周排名：第 ${battle.rank} 名`}</p>
        </WSCard>
        <div className="result-actions">
          <Link className="ws-button" href={addDemoQuery(`/child/battle/play?battleId=${encodeURIComponent(battleId)}&mode=${battle.mode}`, demo)}>再来一局</Link>
          <Link className="ws-button ws-button-secondary" href={addDemoQuery("/child", demo)}>回首页</Link>
        </div>
      </section>
    </ChildShell>
  );
}
