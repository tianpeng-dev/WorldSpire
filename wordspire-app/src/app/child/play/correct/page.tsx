"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChildShell, LoadingState, WSButton, WSCard } from "@/components/child/ChildShell";
import { addDemoQuery, addQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest } from "@/lib/child/api";

export default function CorrectPage() {
  const router = useRouter();
  const { ready, demo, params } = useChildQuery();
  const [completed, setCompleted] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!ready || !params || demo || params.get("complete") !== "1" || completed) return;
    const sessionId = params.get("sessionId");
    if (!sessionId) return;
    setFinalizing(true);
    void apiRequest(`/api/learning/sessions/${encodeURIComponent(sessionId)}/complete`, { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        setCompleted(true);
        setFinalizing(false);
      });
  }, [completed, demo, params, ready]);

  if (!ready || finalizing) return <ChildShell active="map"><LoadingState label="正在收好这一关的星星…" /></ChildShell>;
  const word = params?.get("word") ?? "Apple";
  const translation = params?.get("translation") ?? "苹果";
  const nextIndex = Number(params?.get("index") ?? 1);
  const isComplete = params?.get("complete") === "1";
  const isOffline = params?.get("offline") === "1";
  const nextHref = isComplete
    ? addDemoQuery(`/child/play/complete?sessionId=${encodeURIComponent(params?.get("sessionId") ?? "demo-session")}`, demo)
    : addQuery("/child/play", { sessionId: params?.get("sessionId") ?? "demo-session", index: nextIndex, stageId: params?.get("stageId") ?? "stage-fruit-2" }, demo);

  return (
    <ChildShell active="map">
      <section className="feedback-screen" aria-live="polite">
        <div className="feedback-stars" aria-hidden="true">⭐ +1</div>
        <h1 className="ws-title" style={{ color: "var(--ws-success)" }}>答对啦！</h1>
        <WSCard className="feedback-word">
          <p className="word">{word}</p>
          <p className="translation">{translation}</p>
        </WSCard>
        {isOffline ? <p className="voice-guide-note" role="status">答案已保存在本机，联网后会自动同步。</p> : null}
        <WSButton type="button" onClick={() => router.push(isOffline ? "/child/map" : nextHref)}>{isOffline ? "回到地图" : isComplete ? "查看关卡结算" : "下一题"}</WSButton>
      </section>
    </ChildShell>
  );
}
