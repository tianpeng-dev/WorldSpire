"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LockKeyhole, Play, Sparkles } from "lucide-react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  PageHeader,
  WSCard,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo, apiRequest } from "@/lib/child/api";
import { DEMO_STAGES } from "@/lib/child/catalog";
import { saveLocalSession } from "@/store/local-db";
import type { LearningSessionDTO, Session, StageSummaryDTO } from "@/types";

export default function MapPage() {
  const router = useRouter();
  const { ready, demo } = useChildQuery();
  const [stages, setStages] = useState<StageSummaryDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    void apiOrDemo<{ stages: StageSummaryDTO[] } | StageSummaryDTO[]>("/api/child/stages", DEMO_STAGES, demo)
      .then((payload) => setStages(Array.isArray(payload) ? payload : payload.stages))
      .catch(() => setError("地图暂时没有打开，请再试一次。"));
  }, [demo, ready]);

  async function openStage(stage: StageSummaryDTO) {
    if (starting || stage.status === "locked") return;
    setStarting(stage.id);
    if (demo) {
      router.push(addDemoQuery(`/child/play?stageId=${encodeURIComponent(stage.id)}&index=0`, true));
      return;
    }
    try {
      const result = await apiRequest<{ session: LearningSessionDTO }>("/api/learning/sessions", {
        method: "POST",
        body: { stageId: stage.id },
      });
      try {
        const childProfileId = window.sessionStorage.getItem("ws_child_profile_id");
        if (childProfileId) {
          const localSession: Session = {
            id: result.session.id,
            childProfileId,
            startedAt: Date.now(),
            endedAt: null,
            durationSec: 0,
            syncStatus: "synced",
          };
          await saveLocalSession(localSession);
        }
        window.sessionStorage.setItem(`ws_session_${result.session.id}`, JSON.stringify(result.session));
        if (result.session.question) window.sessionStorage.setItem(`ws_question_${result.session.id}`, JSON.stringify(result.session.question));
      } catch {
        // IndexedDB is an enhancement; a successful server session can still continue online.
      }
      router.push(`/child/play?sessionId=${encodeURIComponent(result.session.id)}`);
    } catch {
      setStarting(null);
      setError("这一关还没准备好，请稍后再试。" );
    }
  }

  if (!ready || (!stages && !error)) return <ChildShell active="map"><LoadingState label="正在展开水果王国…" /></ChildShell>;
  if (error || !stages) return <ChildShell active="map"><ErrorState message={error ?? undefined} /></ChildShell>;

  return (
    <ChildShell active="map">
      <section className="map" aria-label="水果王国闯关地图">
        <PageHeader title="水果王国" subtitle="闯过关卡，收集角色与星星" />
        <div className="map-track">
          {stages.map((stage) => {
            const isOpen = stage.status !== "locked";
            const Icon = stage.status === "locked" ? LockKeyhole : stage.status === "completed" ? Sparkles : Play;
            return (
              <div className={`map-node ${stage.status === "locked" ? "ws-locked" : ""}`} data-status={stage.status} key={stage.id}>
                <div className="map-node-number" aria-hidden="true">{stage.order}</div>
                <WSCard
                  className="map-node-card"
                  role={isOpen ? "button" : undefined}
                  tabIndex={isOpen ? 0 : undefined}
                  onClick={isOpen ? () => void openStage(stage) : undefined}
                  onKeyDown={isOpen ? (event) => { if (event.key === "Enter" || event.key === " ") void openStage(stage); } : undefined}
                  aria-label={isOpen ? `打开第 ${stage.order} 关 ${stage.title}` : `${stage.title}，尚未解锁`}
                >
                  <div className="map-node-title-row">
                    <p className="map-node-title">{stage.title}</p>
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <p className="map-node-description">{starting === stage.id ? "正在准备…" : stage.description}</p>
                </WSCard>
              </div>
            );
          })}
        </div>
      </section>
    </ChildShell>
  );
}
