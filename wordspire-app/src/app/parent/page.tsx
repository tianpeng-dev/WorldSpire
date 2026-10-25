// ================================================================
// 家长端首页（仪表盘）
// 占位页面，不含业务逻辑
// ================================================================

import Link from "next/link";

export default function ParentDashboardPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink-900">今日概况</h1>
        <p className="text-sm text-ink-500">一眼知道孩子学了没</p>
      </header>

      <nav className="grid grid-cols-2 gap-3 text-sm">
        <Link
          href="/parent/dashboard"
          className="rounded-xl bg-white p-4 shadow-sm border border-ink-200"
        >
          <div className="font-bold text-ink-900">首页</div>
        </Link>
        <Link
          href="/parent/report"
          className="rounded-xl bg-white p-4 shadow-sm border border-ink-200"
        >
          <div className="font-bold text-ink-900">报告</div>
        </Link>
        <Link
          href="/parent/battle"
          className="rounded-xl bg-white p-4 shadow-sm border border-ink-200"
        >
          <div className="font-bold text-ink-900">亲子 PK</div>
        </Link>
        <Link
          href="/parent/settings"
          className="rounded-xl bg-white p-4 shadow-sm border border-ink-200"
        >
          <div className="font-bold text-ink-900">设置</div>
        </Link>
      </nav>
    </main>
  );
}
