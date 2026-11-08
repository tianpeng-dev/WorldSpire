"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChildShell, LoadingState, OptionCard, PageHeader, WSButton, WSCard } from "@/components/child/ChildShell";
import { useChildQuery } from "@/components/child/useChildQuery";
import { ApiError, apiRequest } from "@/lib/child/api";
import { DUEL_ROUNDS, type DuelState } from "@/lib/battle/duel-contract";

const closedMessages: Record<string, string> = {
  left: "有玩家离开，房间已关闭。",
  disconnected: "有玩家长时间离线，房间已关闭。",
  waiting_timeout: "等待就绪超时，房间已关闭。",
};

function DuelRoom({ id }: { id: string }) {
  const [state, setState] = useState<DuelState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const actionInFlight = useRef(false);
  const presenceInFlight = useRef(false);
  const revision = useRef(0);
  const deadline = useRef(0);

  const request = useCallback(async (operation: "presence" | "ready" | "leave" | "answer", body?: { roundIndex: number; optionId: string }) => {
    const presence = operation === "presence";
    if (actionInFlight.current || (presence && presenceInFlight.current)) return;
    if (presence) presenceInFlight.current = true;
    else { actionInFlight.current = true; revision.current++; setPending(true); setNotice(null); }
    const currentRevision = revision.current;
    try {
      const next = await apiRequest<DuelState>(`/api/battle/duel/${encodeURIComponent(id)}/${operation}`, {
        method: "POST", body, signal: AbortSignal.timeout(5000),
      });
      if (currentRevision !== revision.current) return;
      deadline.current = performance.now() + next.remainingMs;
      setSeconds(Math.ceil(next.remainingMs / 1000));
      setState(next);
      setError(null);
    } catch (cause) {
      if (currentRevision !== revision.current) return;
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) {
        setUnavailable(true);
        setError("无法访问这个房间，请重新登录或返回大厅。");
      } else if (cause instanceof ApiError && cause.status === 409) {
        setNotice("操作未提交成功，正在更新房间状态。");
      } else {
        setError("暂时无法连接对战服务，正在重连。");
      }
    } finally {
      if (presence) presenceInFlight.current = false;
      else { actionInFlight.current = false; setPending(false); }
    }
  }, [id]);

  const status = state?.status;
  useEffect(() => {
    if (unavailable || status === "closed" || status === "finished") return;
    void request("presence");
    const poll = window.setInterval(() => void request("presence"), 750);
    const clock = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000))), 100);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [request, status, unavailable]);

  return <section className="battle-play" aria-label="真人对战">
    <PageHeader title="真人 1v1" subtitle="两人就绪后开始十回合对战" />
    {error && <p role="alert">{error}</p>}
    {notice && !error && <p role="status">{notice}</p>}
    {!state && !error && <LoadingState label="正在进入房间…" />}
    {state?.status === "waiting" && <WSCard className="battle-prompt">
      <p>房间码：<code>{id}</code></p>
      <p>{state.hasOpponent ? (state.opponentReady ? "好友已就绪" : "好友已加入，等待就绪") : "把房间码发给好友，邀请好友加入。"}</p>
      <WSButton type="button" disabled={state.ready || pending || Boolean(error)} onClick={() => void request("ready")}>{state.ready ? "已就绪" : "我已就绪"}</WSButton>
    </WSCard>}
    {state?.status === "playing" && state.question && <>
      <WSCard className="battle-prompt">
        <p>第 {state.roundIndex} / {DUEL_ROUNDS} 回合 · 剩余 {seconds} 秒</p>
        <p>我的得分：{state.score}　好友得分：{state.opponentScore}</p>
        <h2 className="ws-title">{state.question.targetWord}</h2>
      </WSCard>
      <div className="battle-options" aria-label="对战答案选项">
        {state.question.options.map(option => <OptionCard key={option.id} visual={option.visual} label={option.label}
          disabled={pending || state.answered || seconds === 0 || Boolean(error)}
          onClick={() => void request("answer", { roundIndex: state.roundIndex, optionId: option.id })} />)}
      </div>
      {(state.answered || seconds === 0) && <p role="status">等待下一回合…</p>}
    </>}
    {state?.status === "finished" && <WSCard className="battle-prompt">
      <h2>{state.result === "win" ? "你赢了！" : state.result === "loss" ? "好友获胜" : "平局"}</h2>
      <p>我的得分：{state.score}　好友得分：{state.opponentScore}</p>
      <p>赢下更多回合的一方获胜。</p>
    </WSCard>}
    {state?.status === "closed" && <p role="status">{closedMessages[state.endedReason ?? ""] ?? "房间已关闭。"}</p>}
    {state && !unavailable && (state.status === "waiting" || state.status === "playing")
      ? <WSButton type="button" disabled={pending} onClick={() => void request("leave")}>离开房间</WSButton>
      : <Link href="/child/battle">返回对战大厅</Link>}
  </section>;
}

export default function DuelPage() {
  const { params, ready } = useChildQuery();
  const id = params?.get("room");
  return <ChildShell active="battle">
    {!ready ? <LoadingState label="正在打开房间…" /> : id ? <DuelRoom key={id} id={id} /> : <Link href="/child/battle">返回对战大厅</Link>}
  </ChildShell>;
}
