// ================================================================
// 对战机器人「小塔」
//
// 职责：
//   - 模拟一个与孩子水平接近的 AI 对手
//   - 依据目标准确率、反应时延分布、失误模型生成回合计分
//
// 纯概率模型，本地可推理，离线可用，无 LLM 调用
// ================================================================

import type { BattleRound } from "../../types";

export const botLevels = ["easy", "normal", "hard"] as const;
type BotLevel = typeof botLevels[number];
const profiles = {
  easy: { minLatencyMs: 3000, maxLatencyMs: 5000, targetAccuracy: 0.55, label: "简单" },
  normal: { minLatencyMs: 2300, maxLatencyMs: 4000, targetAccuracy: 0.7, label: "普通" },
  hard: { minLatencyMs: 1600, maxLatencyMs: 3000, targetAccuracy: 0.85, label: "困难" },
};

export function botLevel(opponentId: string): BotLevel {
  if (opponentId === "bot_xiaota") return "easy";
  const level = botLevels.find(item => botId(item) === opponentId);
  if (!level) throw new Error("未知的 AI 对手标识");
  return level;
}

export function botId(level: BotLevel) {
  return `bot_xiaota_${level}`;
}

export function isBotId(id: string) {
  return id === "bot_xiaota" || botLevels.some(level => botId(level) === id);
}

export function nextBotLevel(history: { opponentId: string; winnerId: string | null; childProfileId: string }[]): BotLevel {
  const latest = history[0];
  if (!latest) return "easy";
  const level = botLevel(latest.opponentId);
  const previous = history[1];
  if (!previous || !latest.winnerId || !previous.winnerId || botLevel(previous.opponentId) !== level) return level;
  const won = latest.winnerId === latest.childProfileId;
  if (won !== (previous.winnerId === previous.childProfileId)) return level;
  return botLevels[Math.max(0, Math.min(botLevels.length - 1, botLevels.indexOf(level) + (won ? 1 : -1)))];
}

export function calcBotConfig(level: BotLevel) {
  return { level, ...profiles[level] };
}

/**
 * 生成 AI 在一道题上的作答结果
 */
export function simulateAiAnswer(
  config: ReturnType<typeof calcBotConfig>
): { correct: boolean; latencyMs: number } {
  const latencyMs = config.minLatencyMs + Math.floor(Math.random() * (config.maxLatencyMs - config.minLatencyMs + 1));
  return { correct: Math.random() < config.targetAccuracy, latencyMs };
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
