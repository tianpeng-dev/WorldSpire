// ================================================================
// 词灵塔 WordSpire · 核心领域类型定义
// 与 PRD 第七章数据模型保持一致
// 所有实体以 TypeScript interface 形式描述，不包含实现逻辑
// ================================================================

// ── 枚举 ──────────────────────────────────────────────────────────

export type UserRole = "child" | "guardian";

export type CourseKind = "vocab" | "phonics";

export type QuestionType =
  | "picture_pick"
  | "spell"
  | "meaning_match"
  | "letter_sound"
  | "cvc"
  | "blend";

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type StageStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "completed";

export type GuardianLinkStatus = "pending" | "active" | "revoked";

export type BattleMode = "ai" | "parent_async";

export type BattleStatus =
  | "pending"
  | "invited"
  | "in_progress"
  | "finished"
  | "resolved"
  | "expired";

export type ChildProfileStatus =
  | "activating"
  | "active"
  | "at_risk"
  | "paused";

export type SyncStatus =
  | "local_dirty"
  | "syncing"
  | "synced"
  | "conflict_resolved";

export type NotificationKind =
  | "daily_reminder"
  | "weekly_report"
  | "milestone"
  | "at_risk"
  | "encouragement";

export type NotificationStatus = "queued" | "sent" | "read";

export type ReportPeriod = "week" | "month";

// ── 用户与关系 ───────────────────────────────────────────────────

export interface User {
  id: string;
  role: UserRole;
  nickname: string;
  avatarUrl: string | null;
  createdAt: number;
  lastActiveAt: number;
}

export interface ChildProfile {
  id: string;
  userId: string;
  age: number;
  grade: string;
  level: number;
  wordCount: number;
  streak: number;
  status: ChildProfileStatus;
}

export interface GuardianLink {
  id: string;
  guardianUserId: string;
  childProfileId: string;
  code: string;
  status: GuardianLinkStatus;
  createdAt: number;
}

// ── 内容模型 ─────────────────────────────────────────────────────

export interface Course {
  id: string;
  kind: CourseKind;
  title: string;
  unitIds: string[];
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  order: number;
  stageIds: string[];
}

export interface Stage {
  id: string;
  unitId: string;
  title: string;
  order: number;
  status: StageStatus;
  pointsReward: number;
}

export interface Question {
  id: string;
  stageId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  targetWord: string;
  promptAudioUrl: string | null;
  imageAssetUrl: string | null;
  options: string[];
  correctIndex: number;
}

// ── 学习事件 ─────────────────────────────────────────────────────

export interface Session {
  id: string;
  childProfileId: string;
  stageId?: string;
  startedAt: number;
  endedAt: number | null;
  durationSec: number;
  currentIndex?: number;
  totalQuestions?: number;
  earnedStars?: number;
  syncStatus: SyncStatus;
}

export interface Attempt {
  id: string;
  sessionId: string;
  questionId: string;
  childProfileId?: string;
  correct: boolean;
  latencyMs: number;
  answeredAt: number;
  selectedIndex?: number;
  optionId?: string;
  idempotencyKey?: string;
  syncStatus: SyncStatus;
}

export interface Proficiency {
  id: string;
  childProfileId: string;
  targetWord: string;
  p: number; // 掌握概率 0–1
  attempts: number;
  lastSeenAt: number;
}

// ── 对战 ─────────────────────────────────────────────────────────

export interface Battle {
  id: string;
  mode: BattleMode;
  childProfileId: string;
  opponentId: string;
  stageId: string;
  status: BattleStatus;
  winnerId: string | null;
  baseDate: number;
}

export interface BattleRound {
  id: string;
  battleId: string;
  roundIndex: number;
  playerId: string;
  questionId: string;
  correct: boolean;
  latencyMs: number;
  score: number;
}

export interface LeaderboardEntry {
  id: string;
  childProfileId: string;
  period: "week" | "all_time";
  wins: number;
  score: number;
  rank: number;
  updatedAt: number;
}

// ── 奖励与收藏 ───────────────────────────────────────────────────

export interface StarWallet {
  id: string;
  childProfileId: string;
  balance: number;
  totalEarned: number;
}

export interface CollectionItem {
  id: string;
  childProfileId: string;
  kind: "character" | "badge";
  itemKey: string;
  itemName: string;
  unlockedAt: number;
}

// ── 报告与通知 ───────────────────────────────────────────────────

export interface LearningReport {
  id: string;
  childProfileId: string;
  period: ReportPeriod;
  newWords: number;
  totalTimeMin: number;
  accuracy: number;
  streak: number;
  aiSummary: string;
  generatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  payload: string; // JSON string
  status: NotificationStatus;
  triggeredAt: number;
}

// ── 同步队列 ─────────────────────────────────────────────────────

export interface SyncQueueItem {
  id: string;
  childProfileId: string;
  entity: string;
  entityId: string;
  op: "insert" | "update";
  version: number;
  deviceId: string;
  status: SyncStatus;
  createdAt: number;
  payload?: Record<string, unknown>;
  cursor?: number;
}

// ── DTO / 传输对象 ───────────────────────────────────────────────

export interface SyncRequest {
  deviceId: string;
  childProfileId: string;
  items: SyncQueueItem[];
  lastSyncVersion: number;
}

export interface SyncResponse {
  accepted: number;
  rejected: string[]; // entityId 列表
  serverVersion: number;
  serverItems: SyncQueueItem[]; // 服务端更新的项目
  acknowledgements: Array<{ id: string; entityId: string; status: "accepted" | "rejected"; error?: string; statusCode?: number; issues?: unknown }>;
  hasMore?: boolean;
}

// ── 孩子端页面 DTO ──────────────────────────────────────────────

export interface ChildOverviewDTO {
  child: {
    id: string;
    nickname: string;
    level: number;
    wordCount: number;
    streak: number;
    status: ChildProfileStatus;
  };
  wallet: Pick<StarWallet, "balance" | "totalEarned">;
  today: {
    completed: number;
    total: number;
  };
  weekly: {
    newWords: number;
    accuracy: number | null;
  };
  currentStageId: string | null;
}

export interface StageSummaryDTO {
  id: string;
  title: string;
  order: number;
  pointsReward: number;
  status: StageStatus;
  completedStars: number;
  description: string;
}

export interface QuestionOptionDTO {
  id: string;
  visual: string;
  label: string;
}

export interface QuestionDTO {
  id: string;
  stageId: string;
  targetWord: string;
  translation: string;
  promptAudioUrl: string | null;
  options: QuestionOptionDTO[];
}

export interface LearningSessionDTO {
  id: string;
  stageId: string;
  currentIndex: number;
  totalQuestions: number;
  earnedStars: number;
  question: QuestionDTO | null;
}

export interface AttemptResultDTO {
  correct: boolean;
  questionId: string;
  targetWord: string;
  translation: string;
  correctOption: QuestionOptionDTO;
  earnedStars: number;
  sessionComplete: boolean;
  nextQuestion: QuestionDTO | null;
}

export interface CollectionEntryDTO {
  itemKey: string;
  itemName: string;
  kind: "character" | "badge";
  visual: string;
  unlocked: boolean;
  unlockCost: number;
  description: string;
}

export interface CollectionDTO {
  balance: number;
  characters: CollectionEntryDTO[];
  badges: CollectionEntryDTO[];
}

export interface ReportDTO {
  status: "ready" | "generating" | "empty";
  summary: string;
  overview: {
    newWords: number;
    accuracy: number | null;
    streak: number;
    stars: number;
  };
  abilities: Array<{ key: string; label: string; value: number }>;
  achievements: Array<{ key: string; label: string; visual: string }>;
  totalTimeMin: number;
}

export interface BattleLobbyDTO {
  childAccuracy: number | null;
  aiStageId: string | null;
  parentChallenge: {
    battleId: string;
    stageTitle: string;
    message: string;
    expiresAt: string | null;
  } | null;
}

export interface BattleRoundDTO {
  roundIndex: number;
  childScore: number;
  opponentScore: number;
  childTotal: number;
  opponentTotal: number;
}

export interface BattleDTO {
  id: string;
  mode: BattleMode;
  status: BattleStatus;
  roundIndex: number;
  totalRounds: number;
  childScore: number;
  opponentScore: number;
  childName: string;
  opponentName: string;
  question: QuestionDTO | null;
  winnerId: string | null;
  rank: number | null;
}
