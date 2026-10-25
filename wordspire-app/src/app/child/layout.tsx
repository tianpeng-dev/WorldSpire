// ================================================================
// 孩子端布局（词灵塔暖色系 · Storybook 风格）
// ================================================================

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SyncClient } from "@/components/child/SyncClient";

export default async function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let childProfileId: string | undefined;
  if ((await headers()).get("x-wordspire-public-page") !== "1") {
    const session = await getSession();
    if (session?.role !== "child" || !session.childProfileId) redirect("/child/voice-guide");
    childProfileId = session.childProfileId;
  }
  return (
    <div
      className="min-h-screen ws-child-text"
      style={{
        background: "var(--ws-background)",
        color: "var(--ws-foreground)",
      }}
      data-style="storybook"
    >
      {childProfileId && <SyncClient childProfileId={childProfileId} />}
      {children}
    </div>
  );
}
