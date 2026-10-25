// ================================================================
// useOfflineSync Hook
//
// 孩子端组件中使用：
//   - 初始化 IndexedDB
//   - 联网时自动 flush 同步队列
//   - 暴露 isOnline / pendingCount
// ================================================================

"use client";

import { useState, useEffect } from "react";
import { flushSync, getPendingSync, initLocalDB } from "@/store/local-db";

export function useOfflineSync(childProfileId?: string) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let disposed = false;
    const refresh = async () => {
      await initLocalDB();
      if (!disposed) setPendingCount((await getPendingSync()).length);
    };
    const syncAndRefresh = async () => {
      if (childProfileId && navigator.onLine) await flushSync(childProfileId);
      await refresh();
    };
    void syncAndRefresh();

    const onOnline = () => {
      setIsOnline(true);
      void syncAndRefresh();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      disposed = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [childProfileId]);

  return { isOnline, pendingCount };
}
