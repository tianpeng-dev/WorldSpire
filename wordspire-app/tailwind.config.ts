import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 既有品牌色，供家长端等模块继续使用
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          400: "#94a3b8",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a",
        },
        // 词灵塔孩子端设计令牌（基于设计稿 home-v2）
        ws: {
          background: "#FFF8E7",
          foreground: "#3E2723",
          card: "#FFFFFF",
          "card-foreground": "#3E2723",
          popover: "#FFFFFF",
          "popover-foreground": "#3E2723",
          primary: "#E85D4C",
          "primary-foreground": "#FFFFFF",
          muted: "#F5E6D3",
          "muted-foreground": "#6D4C41",
          border: "rgba(62, 39, 35, 0.12)",
          input: "#FFFFFF",
          ring: "#E85D4C",
          gold: "#F4C542",
          sage: "#7DB9A8",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        primary: {
          50: "#FDF2F0",
          100: "#FADBD7",
          200: "#F5B7AE",
          300: "#EF9285",
          400: "#E85D4C",
          500: "#D64A3A",
          600: "#B53A2C",
        },
        neutral: {
          50: "#FFFDF8",
          100: "#FFF8E7",
          200: "#F5E6D3",
          300: "#E6D2BA",
          400: "#A1887F",
          500: "#6D4C41",
          600: "#3E2723",
        },
      },
      fontFamily: {
        sans: ["Nunito", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        display: [
          "ZCOOL QingKe HuangYou",
          "Nunito",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        "ws-card": "0 2px 8px rgba(0,0,0,0.04)",
        "ws-storybook": "4px 4px 0 rgba(62,39,35,0.08)",
        "ws-button": "0 4px 0 rgba(181,58,44,0.6)",
        "ws-button-sec": "0 4px 0 rgba(62,39,35,0.12)",
      },
      keyframes: {
        "ws-rise": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ws-pop": {
          "0%": { transform: "scale(0.96)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "ws-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--ws-target-width, 60%)" },
        },
        "ws-float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "ws-rise": "ws-rise 0.5s ease-out both",
        "ws-pop": "ws-pop 0.35s ease-out both",
        "ws-fill": "ws-fill 1.2s ease-out both",
        "ws-float": "ws-float 3s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow": "pulse 3s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
