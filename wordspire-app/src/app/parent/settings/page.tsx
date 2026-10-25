"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/child/api";
export default function SettingsPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true); setError("");
    try { await apiRequest("/api/auth/sign-out", { method: "POST", body: {} }); router.push("/parent/sign-in"); router.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "退出失败"); }
    finally { setBusy(false); }
  }
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold text-ink-900 mb-4">设置</h1>
      <button className="rounded border p-3" onClick={signOut} disabled={busy}>{busy ? "正在退出…" : "退出登录"}</button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
