"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const battleId = params?.get("battleId") ?? "demo-battle";

  useEffect(() => {
    if (!ready || !params) return;
    setStartedAt(Date.now());
    setAnswering(false);
    if (demo) {
      setBattle(params.get("mode") === "parent_async" ? { ...DEMO_BATTLE, mode: "parent_async", opponentName: "妈妈" } : DEMO_BATTLE);
      return;
    }
    void apiRequest<BattleDTO | { battle: BattleDTO }>(`/api/battle/${encodeURIComponent(battleId)}`)
      .then((payload) => setBattle("battle" in payload ? payload.battle : payload))
      .catch(() => setError("对战题目暂时没有准备好，请回大厅再试一次。"));
  }, [battleId, demo, params, ready]);

  async function answer(question: QuestionDTO, optionId: string) {
    if (!battle || answering) return;
    setAnswering(true);
    if (demo) {
      router.push(addQuery("/child/battle/result", { battleId, mode: battle.mode }, true));
      return;
    }
    try {
      const result = await apiRequest<{ status: string; battleId: string; roundIndex?: number }>("/api/battle", {
        method: "POST",
        body: {
          action: "submit-round",
          battleId,
          questionId: question.id,
          optionId,
          latencyMs: Math.max(0, Date.now() - startedAt),
          roundIndex: battle.roundIndex,
        },
      });
      if (result.status === "resolved" || result.status === "finished") {
        router.push(`/child/battle/result?battleId=${encodeURIComponent(battleId)}`);
      } else {
        router.push(`/child/battle/play?battleId=${encodeURIComponent(battleId)}&round=${result.roundIndex ?? battle.roundIndex + 1}`);
      }
    } catch {
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
      </section>
    </ChildShell>
  );
}
