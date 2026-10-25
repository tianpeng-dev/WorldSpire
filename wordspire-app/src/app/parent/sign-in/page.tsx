"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/child/api";

export default function SignInPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await apiRequest(`/api/auth/${register ? "sign-up" : "sign-in"}/email`, { method: "POST", body: {
        email: data.get("email"), password: data.get("password"), ...(register ? { name: data.get("name") } : {}),
      } });
      router.push("/parent"); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "登录失败"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md p-6">
    <h1 className="mb-6 text-2xl font-bold">{register ? "家长注册" : "家长登录"}</h1>
    <form onSubmit={submit} className="flex flex-col gap-4">
      {register && <label>昵称<input name="name" required maxLength={64} autoComplete="name" className="block w-full rounded border p-2" /></label>}
      <label>邮箱<input name="email" type="email" required autoComplete="email" className="block w-full rounded border p-2" /></label>
      <label>密码<input name="password" type="password" minLength={8} maxLength={128} required autoComplete={register ? "new-password" : "current-password"} className="block w-full rounded border p-2" /></label>
      <button disabled={busy} className="rounded bg-ink-900 p-3 text-white">{busy ? "正在处理…" : register ? "注册" : "登录"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <button className="mt-4 underline" onClick={() => { setRegister(!register); setError(""); }}>{register ? "使用已有账号登录" : "注册家长账号"}</button>
  </main>;
}
