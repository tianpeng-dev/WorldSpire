"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Home,
  Library,
  Map,
  Shield,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react";
import type { ButtonHTMLAttributes, ComponentProps, HTMLAttributes, ReactNode } from "react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { addDemoQuery, useChildQuery } from "./useChildQuery";

const NAV_ITEMS: Array<{ key: string; label: string; href: string; icon: LucideIcon }> = [
  { key: "home", label: "首页", href: "/child", icon: Home },
  { key: "map", label: "闯关", href: "/child/map", icon: Map },
  { key: "battle", label: "对战", href: "/child/battle", icon: Shield },
  { key: "collection", label: "收藏", href: "/child/collection", icon: Library },
];

export function ChildShell({
  children,
  active,
  showNav = true,
  className = "",
}: {
  children: ReactNode;
  active?: string;
  showNav?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const { ready, demo } = useChildQuery();
  const current = active ?? pathname?.split("/")[2] ?? "home";
  const [childProfileId] = useState<string | undefined>(() => (
    typeof window === "undefined" ? undefined : window.sessionStorage.getItem("ws_child_profile_id") ?? undefined
  ));
  useOfflineSync(ready && !demo ? childProfileId : undefined);

  return (
    <main className={`ws-shell ${className}`} data-style="storybook">
      <div className="ws-page-content">{children}</div>
      {showNav ? (
        <nav className="ws-bottom-nav" aria-label="主导航">
          {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => {
            const isActive = current === key || (key === "home" && pathname === "/child");
            return (
              <Link
                href={addDemoQuery(href, demo)}
                key={key}
                className="ws-nav-item"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" strokeWidth={2.5} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}

export function WSCard({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`ws-card ${className}`} {...props}>{children}</div>;
}

export function WSButton({ children, className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return <button className={`ws-button ${variant === "secondary" ? "ws-button-secondary" : ""} ${className}`} {...props}>{children}</button>;
}

export function WSLinkButton({ children, className = "", variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return <Link className={`ws-button ${variant === "secondary" ? "ws-button-secondary" : ""} ${className}`} {...props}>{children}</Link>;
}

export function StarBadge({ children }: { children: ReactNode }) {
  return <span className="ws-badge"><Star aria-hidden="true" size={18} fill="currentColor" />{children}</span>;
}

export function PageHeader({ title, subtitle, backHref }: { title: string; subtitle?: string; backHref?: string }) {
  return (
    <header className="ws-page-header">
      {backHref ? <Link href={backHref} className="ws-back-button" aria-label="返回"><ArrowLeft aria-hidden="true" /></Link> : null}
      <div>
        <h1 className="ws-title">{title}</h1>
        {subtitle ? <p className="ws-subtitle">{subtitle}</p> : null}
      </div>
    </header>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="ws-progress-wrap">
      <div className="ws-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "进度"}>
        <div className="fill" style={{ width: `${percent}%` }} />
      </div>
      {label ? <span className="ws-progress-label">{label}</span> : null}
    </div>
  );
}

export function LoadingState({ label = "正在准备冒险…" }: { label?: string }) {
  return <div className="ws-state-panel" role="status"><Sparkles aria-hidden="true" className="ws-state-icon ws-spin" /><p>{label}</p></div>;
}

export function ErrorState({ message = "网络好像走神了，请再试一次。", onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="ws-state-panel ws-state-panel-error" role="alert"><p>{message}</p>{onRetry ? <WSButton onClick={onRetry}>再试一次</WSButton> : null}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="ws-state-panel"><p>{message}</p></div>;
}

export function AudioButton({ onClick, label = "再听一遍" }: { onClick: () => void; label?: string }) {
  return <WSButton type="button" variant="secondary" className="ws-audio-button" onClick={onClick}><Volume2 aria-hidden="true" />{label}</WSButton>;
}

export function OptionCard({ visual, label, onClick, disabled = false }: { visual: string; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="ws-option-card" onClick={onClick} disabled={disabled}><span className="ws-option-visual" aria-hidden="true">{visual}</span><span>{label}</span></button>;
}
