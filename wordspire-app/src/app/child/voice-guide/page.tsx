"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChildShell, WSButton } from "@/components/child/ChildShell";
import { useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest } from "@/lib/child/api";
import { speak } from "@/lib/child/audio";

export default function VoiceGuidePage() {
  const router = useRouter();
  const { ready, demo } = useChildQuery();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startAdventure() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    speak("你好呀，我是小塔，我们一起去闯关吧！");

    if (demo) {
      router.push("/child?demo=1");
      return;
    }

    try {
      const result = await apiRequest<{ childProfileId?: string }>("/api/auth", {
        method: "POST",
        body: { action: "guest-signup", age: 7, grade: "一年级" },
      });
      if (result.childProfileId) window.sessionStorage.setItem("ws_child_profile_id", result.childProfileId);
      router.push("/child");
      router.refresh();
    } catch {
      setError("现在还连不上词灵塔，请检查网络后再试一次。");
      setBusy(false);
    }
  }

  if (!ready) return <ChildShell showNav={false}><div /></ChildShell>;

  return (
    <ChildShell showNav={false}>
      <section className="voice-guide" aria-labelledby="voice-guide-title">
        <div className="ws-hero">
          <img src="/assets/hero-wordspire-storybook.jpg" alt="词灵塔" fetchPriority="high" />
        </div>
        <h1 className="ws-title" id="voice-guide-title">词灵塔</h1>
        <p className="ws-subtitle">没有大人陪，也能把英语玩会</p>
        <div className="ws-mascot-wrap">
          <img src="/assets/mascot-word-spirit.jpg" className="ws-mascot" alt="小塔" />
          <div className="ws-card ws-mascot-bubble">
            <p>“你好呀，我是小塔，我们一起去闯关吧！”</p>
          </div>
        </div>
        <WSButton type="button" onClick={startAdventure} disabled={busy}>
          {busy ? "正在出发…" : "开始冒险"}
        </WSButton>
        {error ? <p className="voice-guide-note" role="alert">{error}</p> : null}
        <p className="voice-guide-note">全程语音引导，小朋友自己就能玩</p>
      </section>
    </ChildShell>
  );
}
