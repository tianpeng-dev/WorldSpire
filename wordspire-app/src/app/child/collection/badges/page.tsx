"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChildShell,
  ErrorState,
  LoadingState,
  PageHeader,
  WSCard,
} from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiOrDemo } from "@/lib/child/api";
import { DEMO_COLLECTION } from "@/lib/child/catalog";
import { getPreviewCollection } from "@/lib/child/preview-collection";
import type { CollectionDTO } from "@/types";

export default function CollectionBadgesPage() {
  const { ready, demo } = useChildQuery();
  const [collection, setCollection] = useState<CollectionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (demo) {
      setCollection(getPreviewCollection());
      return;
    }
    void apiOrDemo<CollectionDTO | { collection: CollectionDTO }>("/api/collection", DEMO_COLLECTION, demo)
      .then((payload) => setCollection("collection" in payload ? payload.collection : payload))
      .catch(() => setError("徽章暂时没有打开，请再试一次。"));
  }, [demo, ready]);

  if (!ready || (!collection && !error)) return <ChildShell active="collection"><LoadingState label="正在打开徽章墙…" /></ChildShell>;
  if (error || !collection) return <ChildShell active="collection"><ErrorState message={error ?? undefined} /></ChildShell>;

  const visible = collection.badges.slice(0, 4);
  const unlockedCount = collection.badges.filter((item) => item.unlocked).length;
  return (
    <ChildShell active="collection">
      <section className="collection-badges" aria-label="徽章墙">
        <PageHeader title="徽章墙" subtitle={`你已经获得 ${unlockedCount} / ${collection.badges.length} 枚徽章`} />
        <div className="collection-grid">
          {visible.map((item) => (
            <WSCard className={`collection-card ${item.unlocked ? "" : "ws-locked"}`} key={item.itemKey}>
              <div className="collection-visual" aria-hidden="true">{item.visual}</div>
              <p className="collection-name">{item.itemName}</p>
            </WSCard>
          ))}
        </div>
        <div className="collection-footer">
          <Link className="ws-button ws-button-secondary" href={addDemoQuery("/child/collection", demo)}>查看角色</Link>
        </div>
      </section>
    </ChildShell>
  );
}
