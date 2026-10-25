"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  PageHeader,
  StarBadge,
  WSCard,
  WSLinkButton,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo } from "@/lib/child/api";
import { DEMO_COLLECTION } from "@/lib/child/catalog";
import { getPreviewCollection } from "@/lib/child/preview-collection";
import type { CollectionDTO } from "@/types";

export default function CollectionCharactersPage() {
  const { ready, demo } = useChildQuery();
  const [collection, setCollection] = useState<CollectionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (demo) {
      setCollection(getPreviewCollection());
      return;
    }
    void apiOrDemo<{ collection?: CollectionDTO } | CollectionDTO>("/api/collection", DEMO_COLLECTION, demo)
      .then((payload) => setCollection("collection" in payload && payload.collection ? payload.collection : payload as CollectionDTO))
      .catch(() => setError("收藏图鉴暂时没有打开，请再试一次。"));
  }, [demo, ready]);

  if (!ready || (!collection && !error)) return <ChildShell active="collection"><LoadingState label="正在打开收藏图鉴…" /></ChildShell>;
  if (error || !collection) return <ChildShell active="collection"><ErrorState message={error ?? undefined} /></ChildShell>;

  const visible = collection.characters.slice(0, 6);
  const unlockedCount = collection.characters.filter((item) => item.unlocked).length;
  return (
    <ChildShell active="collection">
      <section className="collection-characters" aria-label="角色图鉴">
        <PageHeader title="角色图鉴" subtitle={`你已经收集 ${unlockedCount} / ${collection.characters.length} 个角色`} />
        <div className="collection-balance-row"><StarBadge>{collection.balance} 星</StarBadge></div>
        <div className="collection-grid">
          {visible.map((item) => item.unlocked ? (
            <WSCard className="collection-card" key={item.itemKey}>
              <div className="collection-visual" aria-hidden="true">{item.visual}</div>
              <p className="collection-name">{item.itemName}</p>
            </WSCard>
          ) : (
            <Link key={item.itemKey} href={addDemoQuery(`/child/collection/unlock?itemKey=${encodeURIComponent(item.itemKey)}`, demo)} className="ws-card collection-card collection-card-action ws-locked" aria-label={`解锁${item.itemName}`}>
              <div className="collection-visual" aria-hidden="true">❓</div>
              <p className="collection-name">未解锁</p>
            </Link>
          ))}
        </div>
        <div className="collection-footer">
          <WSLinkButton href={addDemoQuery("/child/collection/badges", demo)} variant="secondary">查看徽章</WSLinkButton>
        </div>
      </section>
    </ChildShell>
  );
}
