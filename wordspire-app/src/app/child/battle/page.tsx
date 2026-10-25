"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, HeartHandshake, Swords } from "lucide-react";
import {
  ChildShell,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  WSButton,
  WSCard,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo, apiRequest } from "@/lib/child/api";
import { DEMO_BATTLE_LOBBY } from "@/lib/child/catalog";
import type { BattleLobbyDTO } from "@/types";

export default function BattleLobbyPage() {
  const router = useRouter();
  const { ready, demo } = useChildQuery();
  const [lobby, setLobby] = useState<BattleLobbyDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void apiOrDemo<{ lobby?: BattleLobbyDTO } | BattleLobbyDTO>("/api/battle", DEMO_BATTLE_LOBBY, demo)
      .then((payload) => setLobby("lobby" in payload && payload.lobby ? payload.lobby : payload as BattleLobbyDTO))
      .catch(() => setError("对战大厅暂时没有打开，请再试一次。"));
  }, [demo, ready]);

  async function startBattle(mode: "ai" | "parent_async") {
    if (!lobby || starting) return;
    setStarting(true);
    if (demo) {
      router.push(addDemoQuery(`/child/battle/play?battleId=demo-battle&mode=${mode}`, true));
      return;
    }
    try {
      const body = mode === "ai"
        ? { action: "create-ai", stageId: lobby.aiStageId }
        : { action: "accept-parent", battleId: lobby.parentChallenge?.battleId };
      const result = await apiRequest<{ battleId: string }>("/api/battle", { method: "POST", body });
      router.push(`/child/battle/play?battleId=${encodeURIComponent(result.battleId)}`);
    } catch {
      setStarting(false);
      setError("对战没有成功开始，请稍后再试。" );
    }
  }

  if (!ready || (!lobby && !error)) return <ChildShell active="battle"><LoadingState label="正在召集对手…" /></ChildShell>;
  if (error || !lobby) return <ChildShell active="battle"><ErrorState message={error ?? undefined} /></ChildShell>;

  return (
    <ChildShell active="battle">
      <section className="battle-lobby" aria-label="对战大厅">
        <PageHeader title="对战大厅" subtitle="挑战小塔，或接受妈妈的亲子 PK" />
        <WSCard className="battle-lobby-card">
          <div className="battle-card-visual"><Bot aria-hidden="true" size={72} strokeWidth={1.7} /></div>
          <h2>挑战小塔</h2>
          <p>AI 对手会按你的水平出题，离线也能玩</p>
          <WSButton type="button" onClick={() => void startBattle("ai")} disabled={starting || !lobby.aiStageId}>开始对战</WSButton>
        </WSCard>
        <WSCard className="battle-lobby-card">
          <div className="battle-card-visual"><HeartHandshake aria-hidden="true" size={72} strokeWidth={1.7} /></div>
          <h2>亲子 PK</h2>
          <p>妈妈发来挑战，接受就能开始</p>
          {lobby.parentChallenge ? (
            <WSCard className="battle-challenge">
              <p className="challenge-title">妈妈的挑战：{lobby.parentChallenge.stageTitle}</p>
              <p className="challenge-message">“{lobby.parentChallenge.message}”</p>
            </WSCard>
          ) : <EmptyState message="暂时没有待接受的亲子挑战" />}
          <WSButton type="button" onClick={() => void startBattle("parent_async")} disabled={starting || !lobby.parentChallenge}>接受挑战</WSButton>
        </WSCard>
        <div className="ws-state-panel" style={{ minHeight: 0, marginTop: 12 }}>
          <Swords aria-hidden="true" className="ws-state-icon" />
          <p>{demo ? "当前使用设计示例，对战结果和星星仅用于前端审查" : "每场对战都会由服务端记录结果和奖励"}</p>
        </div>
      </section>
    </ChildShell>
  );
}
