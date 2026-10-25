"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChildShell, ErrorState, LoadingState, StarBadge, WSButton, WSCard } from "@/components/child/ChildShell";
import { addDemoQuery, useChildQuery } from "@/components/child/useChildQuery";
import { apiRequest, ApiError } from "@/lib/child/api";
import { getPreviewCollection, unlockPreviewCharacter } from "@/lib/child/preview-collection";
import type { CollectionDTO, CollectionEntryDTO } from "@/types";

export default function CollectionUnlockPage() {
  const router = useRouter();
  const { ready, demo, params } = useChildQuery();
  const [entry, setEntry] = useState<CollectionEntryDTO | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const itemKey = params?.get("itemKey") ?? "strawberry";

  useEffect(() => {
    if (!ready) return;
    if (demo) {
      const collection = getPreviewCollection();
      const next = collection.characters.find((item) => item.itemKey === itemKey);
      if (!next) throw new Error("PREVIEW_ITEM_NOT_FOUND");
      setEntry(next);
      setBalance(collection.balance);
      return;
    }
    void apiRequest<CollectionDTO | { collection: CollectionDTO }>("/api/collection")
      .then((payload) => {
        const collection = "collection" in payload ? payload.collection : payload;
        setEntry(collection.characters.concat(collection.badges).find((item) => item.itemKey === itemKey) ?? null);
        setBalance(collection.balance);
      })
      .catch(() => setError("解锁信息暂时没有读到，请回收藏再试一次。"));
  }, [demo, itemKey, ready]);

  async function unlock() {
    if (!entry || busy) return;
    setBusy(true);
    setError(null);
    if (demo) {
      const collection = unlockPreviewCharacter(entry.itemKey);
      setBalance(collection.balance);
      router.push(addDemoQuery("/child/collection", true));
      return;
    }
    try {
      const result = await apiRequest<{ balance: number }>("/api/collection/unlock", {
        method: "POST",
        body: { itemKey: entry.itemKey },
      });
      setBalance(result.balance);
      window.location.assign("/child/collection");
    } catch (reason) {
      setBusy(false);
      setError(reason instanceof ApiError && reason.status === 409 ? "这个角色已经在收藏里啦。" : "星星不够或网络走神了，请再试一次。" );
    }
  }

  if (!ready || (!entry && !error)) return <ChildShell active="collection"><LoadingState label="正在准备解锁…" /></ChildShell>;
  if (error || !entry) return <ChildShell active="collection"><ErrorState message={error ?? "找不到这个收藏"} /></ChildShell>;

  return (
    <ChildShell active="collection">
      <section className="unlock-page" aria-label="解锁收藏">
        <WSCard className="unlock-modal">
          <div className="unlock-visual" aria-hidden="true">{entry.visual}</div>
          <h2 className="ws-title">解锁{entry.itemName}</h2>
          <p className="unlock-cost">需要 {entry.unlockCost} 颗星星</p>
          <div className="unlock-balance"><StarBadge>{balance ?? 0}</StarBadge><span>- {entry.unlockCost}</span></div>
          {error ? <p className="voice-guide-note" role="alert">{error}</p> : null}
          <div className="unlock-actions">
            <WSButton type="button" onClick={() => void unlock()} disabled={busy || entry.unlocked || (balance ?? 0) < entry.unlockCost}>{entry.unlocked ? "已经解锁" : busy ? "解锁中…" : "确认解锁"}</WSButton>
            <Link className="ws-button ws-button-secondary" href={addDemoQuery("/child/collection", demo)}>再想想</Link>
          </div>
        </WSCard>
      </section>
    </ChildShell>
  );
}
