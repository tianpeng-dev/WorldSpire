"use client";

import { useRouter } from "next/navigation";
import { ChildShell, WSButton, WSCard } from "@/components/child/ChildShell";
import { addQuery, useChildQuery } from "@/components/child/useChildQuery";

export default function WrongPage() {
  const router = useRouter();
  const { ready, demo, params } = useChildQuery();

  if (!ready) return <ChildShell active="map"><div /></ChildShell>;
  const sessionId = params?.get("sessionId") ?? "demo-session";
  const index = Number(params?.get("index") ?? 0);
  const word = params?.get("word") ?? "Apple";
  const translation = params?.get("translation") ?? "苹果";
  const correctVisual = params?.get("correctVisual") ?? "🍎";
  const isOffline = params?.get("offline") === "1";
  const retryHref = addQuery("/child/play", { sessionId, index, stageId: params?.get("stageId") ?? "stage-fruit-2" }, demo);

  return (
    <ChildShell active="map">
      <section className="feedback-screen" aria-live="polite">
        <div className="feedback-mascot">
          <img src="/assets/mascot-word-spirit.jpg" className="ws-mascot" alt="小塔" />
          <WSCard><p>“没关系，再试一次！”</p></WSCard>
        </div>
        <h1 className="ws-title">再想想看</h1>
        <WSCard className="feedback-hint">
          <p className="hint-label">正确答案是</p>
          <p className="hint-answer">{correctVisual} {word}</p>
          <p className="translation">{translation}</p>
        </WSCard>
        {isOffline ? <p className="voice-guide-note" role="status">这次答案已保存在本机，联网后会自动同步。</p> : null}
        <WSButton type="button" onClick={() => router.push(isOffline ? "/child/map" : retryHref)}>{isOffline ? "回到地图" : "再试一次"}</WSButton>
      </section>
    </ChildShell>
  );
}
