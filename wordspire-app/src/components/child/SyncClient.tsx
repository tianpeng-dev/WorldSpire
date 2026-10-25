"use client";
import { useEffect, useState } from "react";
import { flushSync } from "@/store/local-db";

export function SyncClient({ childProfileId }: { childProfileId: string }) {
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    async function synchronize() {
      try {
        const result = await flushSync(childProfileId);
        if (!disposed) setError(result?.acknowledgements.some(item => item.status === "rejected") ? "部分学习记录尚未同步，请重试。" : "");
      } catch (failure) {
        if (!disposed) setError(`学习记录尚未同步：${failure instanceof Error ? failure.message : "请求失败"}`);
      }
    }
    void synchronize();
    window.addEventListener("online", synchronize);
    return () => { disposed = true; window.removeEventListener("online", synchronize); };
  }, [childProfileId, retry]);
  return error ? <div role="status" className="border-b bg-white p-3 text-center text-sm">
    <span>{error}</span><button className="ml-3 underline" onClick={() => setRetry(value => value + 1)}>重新同步</button>
  </div> : null;
}
