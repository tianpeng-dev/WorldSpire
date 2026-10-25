// ================================================================
// 通用工具
// ================================================================

import { nanoid } from "nanoid";

/** 生成数据库 ID（21 位 nanoid，与 schema 保持一致） */
export const newId = (): string => nanoid();

/** 等待 n 毫秒（用于测试/动画占位） */
export const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** 将字节数格式化为可读字符串 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 随机昵称生成（游客建档时用） */
const ADJ = ["勇敢的", "聪明的", "好奇的", "快乐的", "闪亮的", "小小"];
const NOUN = ["探险家", "科学家", "艺术家", "宇航员", "建筑师", "骑士"];

export function randomNickname(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return a + n;
}

/** 范围夹取 */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));
