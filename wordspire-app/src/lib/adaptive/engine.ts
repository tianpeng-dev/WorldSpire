// ================================================================
// 自适应学习引擎（BKT 简化版）
//
// 职责：
//   1. 每次答题后更新 Proficiency.p（掌握概率）
//   2. 选择下一题难度
//   3. 判断是否卡关并触发干预
//
// 实现说明：
//   - 纯函数 + 状态快照，可在前端与后端各跑一份
//   - 前端负责即时反馈，后端负责权威合并
//   - 无 LLM 调用，零边际成本
// ================================================================

import type { Proficiency, DifficultyLevel, Question } from "../../types";

// BKT 参数（MVP 采用简化的单参数更新）
const PARAMS = {
  /** 答对时掌握概率提升系数 */
  learnGain: 0.12,
  /** 答错时掌握概率下降系数 */
  forgetRate: 0.06,
  /** 初始掌握概率 */
  initialP: 0.2,
  /** 卡关阈值（同关卡连续失败次数） */
  stuckThreshold: 3,
};

/**
 * 根据本次答题结果更新掌握概率
 */
export function updateProficiency(
  prev: Proficiency | null,
  correct: boolean
): Pick<Proficiency, "p" | "attempts" | "lastSeenAt"> {
  const baseP = prev?.p ?? PARAMS.initialP;
  const attempts = (prev?.attempts ?? 0) + 1;

  let nextP = correct
    ? baseP + PARAMS.learnGain * (1 - baseP)
    : baseP * (1 - PARAMS.forgetRate);

  // 夹在 0.01–0.99 之间
  nextP = Math.max(0.01, Math.min(0.99, nextP));

  return {
    p: Number(nextP.toFixed(4)),
    attempts,
    lastSeenAt: Date.now(),
  };
}

/**
 * 根据当前掌握度选择下一题难度档位
 */
export function pickDifficulty(p: number): DifficultyLevel {
  if (p < 0.3) return 1;
  if (p < 0.5) return 2;
  if (p < 0.7) return 3;
  if (p < 0.85) return 4;
  return 5;
}

/**
 * 从候选题中挑一道符合目标难度的题
 * 找不到时向相邻难度扩展
 */
export function pickQuestion(
  candidates: Question[],
  targetDifficulty: DifficultyLevel,
  excludeIds: Set<string>
): Question | null {
  // 优先目标难度
  let pool = candidates.filter(
    (q) => q.difficulty === targetDifficulty && !excludeIds.has(q.id)
  );

  // 向两侧扩展
  if (pool.length === 0) {
    const offsets = [1, -1, 2, -2];
    for (const offset of offsets) {
      const d = (targetDifficulty + offset) as DifficultyLevel;
      if (d < 1 || d > 5) continue;
      pool = candidates.filter(
        (q) => q.difficulty === d && !excludeIds.has(q.id)
      );
      if (pool.length > 0) break;
    }
  }

  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 卡关判断：连续失败次数是否达阈值
 */
export function isStuck(consecutiveFailures: number): boolean {
  return consecutiveFailures >= PARAMS.stuckThreshold;
}

/**
 * 生成卡关干预建议（降级难度 + 鼓励话术占位）
 */
export function stuckIntervention(): {
  action: "lower_difficulty" | "encourage" | "hint";
} {
  return { action: "lower_difficulty" };
}
