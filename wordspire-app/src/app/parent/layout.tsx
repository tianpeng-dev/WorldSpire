// ================================================================
// 家长端布局
// ================================================================

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if ((await headers()).get("x-wordspire-public-page") !== "1" && (await getSession())?.role !== "guardian") redirect("/parent/sign-in");
  return (
    <div className="min-h-screen bg-ink-50">
      {children}
    </div>
  );
}
