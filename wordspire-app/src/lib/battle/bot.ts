// ================================================================
// 对战机器人「小塔」
//
// 职责：
//   - 模拟一个与孩子水平接近的 AI 对手
//   - 依据目标准确率、反应时延分布、失误模型生成回合计分
//
// 纯概率模型，本地可推理，离线可用，无 LLM 调用
// ================================================================

import type { BattleRound, Question } from "../../types";

interface AiBotConfig {
  /** 目标准确率 0–1 */
  targetAccuracy: number;
  /** 平均反应时间（毫秒） */
  avgLatencyMs: number;
  /** 反应时间标准差 */
  latencyStdMs: number;
  /** 失误率（即使会做也故意错的比例，模拟"走神"） */
  slipRate: number;
}

/**
 * 根据孩子近 7 日准确率计算 AI 配置，保证对手有输有赢
 */
export function calcBotConfig(childAccuracy: number): AiBotConfig {
  // AI 准确率略低于孩子，给孩子 60% 左右胜率
  const target = Math.max(0.35, Math.min(0.75, childAccuracy - 0.08));
  return {
    targetAccuracy: target,
    avgLatencyMs: 1800 + Math.random() * 800,
    latencyStdMs: 600,
    slipRate: 0.08,
  };
}

/**
 * 生成 AI 在一道题上的作答结果
 */
export function simulateAiAnswer(
  question: Question,
  config: AiBotConfig
): { correct: boolean; latencyMs: number } {
  // 近似正态分布的反应时间（Box-Muller 简化）
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let latency = config.avgLatencyMs + z * config.latencyStdMs;
  latency = Math.max(600, Math.min(5000, latency));

  // 是否答对：基础准确率 - 失误率
  const effectiveAcc = config.targetAccuracy * (1 - config.slipRate);
  const correct = Math.random() < effectiveAcc;

  return { correct, latencyMs: Math.round(latency) };
}

/**
 * 计分规则：答对得分 = 基础分 + 速度奖励
 */
export function calcRoundScore(
  correct: boolean,
  latencyMs: number,
  baseScore = 100
): number {
  if (!correct) return 0;
  const speedBonus = Math.max(0, Math.round((5000 - latencyMs) / 50));
  return baseScore + speedBonus;
}

/**
 * 根据回合结果判定胜负（三局两胜）
 */
export function determineWinner(
  childRounds: BattleRound[],
  opponentRounds: BattleRound[]
): {
  childScore: number;
  opponentScore: number;
  winner: "child" | "opponent" | "draw";
} {
  const childScore = childRounds.reduce((s, r) => s + r.score, 0);
  const opponentScore = opponentRounds.reduce((s, r) => s + r.score, 0);

  let winner: "child" | "opponent" | "draw" = "draw";
  if (childScore > opponentScore) winner = "child";
  else if (opponentScore > childScore) winner = "opponent";

  return { childScore, opponentScore, winner };
}
