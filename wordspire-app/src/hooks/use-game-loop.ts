// ================================================================
// useGameLoop Hook（骨架）
//
// 孩子端 Canvas 游戏主循环的统一封装
// 业务开发阶段接入具体游戏逻辑
// ================================================================

"use client";

import { useEffect, useRef } from "react";

interface GameLoopOptions {
  onTick: (dtMs: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  running?: boolean;
}

export function useGameLoop({
  onTick,
  onRender,
  canvasRef,
  running = true,
}: GameLoopOptions) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!running || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const loop = (t: number) => {
      const dt = lastRef.current ? t - lastRef.current : 16;
      lastRef.current = t;

      onTick(dt);
      onRender?.(ctx);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [running, onTick, onRender, canvasRef]);
}
