// ================================================================
// 根布局（App Router）
// ================================================================

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "词灵塔 WordSpire",
  description: "面向 4-11 岁儿童的游戏化英语学习平台",
  applicationName: "词灵塔 WordSpire",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E85D4C",
};

const fontLink = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=ZCOOL+QingKe+HuangYou&family=ZCOOL+KuaiLe&display=swap"
  />
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>{fontLink}</head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
