"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bot, UserRound } from "lucide-react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  OptionCard,
  WSCard,
} from "@/components/child/ChildShell";
import { addQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest } from "@/lib/child/api";
import { DEMO_BATTLE } from "@/lib/child/catalog";
import type { BattleDTO, QuestionDTO } from "@/types";

export default function BattlePlayPage() {
  const router = useRouter();
  const { ready, demo, params } = useChildQuery();
  const [battle, setBattle] = useState<BattleDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const round = useRef<{ startedAt: number; controller: AbortController; timer?: ReturnType<typeof setTimeout> } | null>(null);

  const battleId = params?.get("battleId") ?? "demo-battle";

  useEffect(() => {
    if (!ready || !params) return;
    const current = { startedAt: performance.now(), controller: new AbortController() } as NonNullable<typeof round.current>;
    round.current = current;
    const cleanup = () => {
      current.controller.abort();
      clearTimeout(current.timer);
      if (round.current === current) round.current = null;
    };
    setBattle(null);
    setError(null);
    setAnswering(false);
    if (demo) {
      setBattle(params.get("mode") === "parent_async" ? { ...DEMO_BATTLE, mode: "parent_async", opponentName: "妈妈" } : DEMO_BATTLE);
      return cleanup;
    }
    void apiRequest<BattleDTO | { battle: BattleDTO }>(`/api/battle/${encodeURIComponent(battleId)}`, { signal: current.controller.signal })
      .then((payload) => {
        if (current.controller.signal.aborted) return;
        current.startedAt = performance.now();
        setBattle("battle" in payload ? payload.battle : payload);
      })
      .catch(() => { if (!current.controller.signal.aborted) setError("对战题目暂时没有准备好，请回大厅再试一次。"); });
    return cleanup;
  }, [battleId, demo, params, ready]);

  async function answer(question: QuestionDTO, optionId: string) {
    const current = round.current;
    if (!battle || answering || !current) return;
    setAnswering(true);
    if (demo) {
      router.push(addQuery("/child/battle/result", { battleId, mode: battle.mode }, true));
      return;
    }
    try {
      const result = await apiRequest<{ status: string; battleId: string; roundIndex?: number; aiLatencyMs: number }>("/api/battle", {
        method: "POST",
        signal: current.controller.signal,
        body: {
          action: "submit-round",
          battleId,
          questionId: question.id,
          optionId,
          latencyMs: Math.min(120000, Math.round(performance.now() - current.startedAt)),
          roundIndex: battle.roundIndex,
        },
      });
      if (current.controller.signal.aborted) return;
      const remaining = result.aiLatencyMs - (performance.now() - current.startedAt);
      const advance = () => {
        if (result.status === "resolved" || result.status === "finished") {
          router.push(`/child/battle/result?battleId=${encodeURIComponent(battleId)}`);
        } else {
          router.push(`/child/battle/play?battleId=${encodeURIComponent(battleId)}&round=${result.roundIndex ?? battle.roundIndex + 1}`);
        }
      };
      if (remaining > 0) current.timer = setTimeout(advance, remaining);
      else advance();
    } catch {
      if (current.controller.signal.aborted) return;
      setAnswering(false);
      setError("这一回合没有提交成功，请再试一次。" );
    }
  }

  if (!ready || (!battle && !error)) return <ChildShell active="battle"><LoadingState label="小塔正在准备对战题目…" /></ChildShell>;
  if (error || !battle || !battle.question) return <ChildShell active="battle"><ErrorState message={error ?? "对战题目为空"} /></ChildShell>;

  const question = battle.question;
  return (
    <ChildShell active="battle">
      <section className="battle-play" aria-label="进行对战">
        <header className="battle-header">
          <div className="battle-header-player">
            <div className="battle-player-visual"><UserRound aria-hidden="true" size={48} /></div>
            <p className="battle-player-name">{battle.childName}</p>
            <p className="battle-player-score">{battle.childScore}</p>
          </div>
          <div className="battle-vs"><strong>VS</strong><span>第 {battle.roundIndex} 回合</span></div>
          <div className="battle-header-player">
            <div className="battle-player-visual"><Bot aria-hidden="true" size={48} /></div>
            <p className="battle-player-name">{battle.opponentName}</p>
            <p className="battle-player-score">{battle.opponentScore}</p>
          </div>
        </header>
        <WSCard className="battle-prompt">
          <p>快速选出正确图片</p>
          <h2 className="ws-title">{question.targetWord}</h2>
        </WSCard>
        <div className="battle-options" aria-label="对战答案选项">
          {question.options.map((option) => (
            <OptionCard key={option.id} visual={option.visual} label={option.label} disabled={answering} onClick={() => void answer(question, option.id)} />
          ))}
        </div>
        {answering && <p role="status">正在等待回合结果…</p>}
      </section>
    </ChildShell>
  );
}
