// ================================================================
// 数据库 Schema · Drizzle ORM（PostgreSQL / Vercel Postgres）
// 对应 PRD 第七章领域实体
// 注：孩子端本地 IndexedDB 的 schema 另由 store/ 层维护
// ================================================================

import {
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  json,
  varchar,
  index,
  uniqueIndex,
  check,
  bigint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── 用户与关系 ───────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id", { length: 21 }).primaryKey(),
  role: varchar("role", { length: 16 }).notNull().default("guardian"),
  nickname: varchar("nickname", { length: 64 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => [check("users_role_check", sql`${table.role} in ('child', 'guardian')`)]);

export const authSessions = pgTable("auth_sessions", {
  id: varchar("id", { length: 21 }).primaryKey(),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceId: varchar("device_id", { length: 128 }),
}, table => [index("auth_sessions_user_idx").on(table.userId)]);

export const authAccounts = pgTable("auth_accounts", {
  id: varchar("id", { length: 21 }).primaryKey(),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"), refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"), password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [uniqueIndex("auth_accounts_provider_unq").on(table.providerId, table.accountId), index("auth_accounts_user_idx").on(table.userId)]);

export const authVerifications = pgTable("auth_verifications", {
  id: varchar("id", { length: 21 }).primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [index("auth_verifications_identifier_idx").on(table.identifier)]);

export const rateLimits = pgTable("rate_limits", {
  id: varchar("id", { length: 21 }).primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const childProfiles = pgTable(
  "child_profiles",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull().references(() => users.id),
    age: integer("age").notNull(),
    grade: varchar("grade", { length: 16 }).notNull(),
    level: integer("level").notNull().default(1),
    wordCount: integer("word_count").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    status: varchar("status", { length: 16 }).notNull().default("activating"),
    lastActiveAt: timestamp("last_active_at"),
    friendCode: varchar("friend_code", { length: 8 }).notNull(),
    primaryDeviceId: varchar("primary_device_id", { length: 128 }),
    syncCursor: integer("sync_cursor").notNull().default(0),
  },
  (table) => ({
    userIdIdx: uniqueIndex("child_profiles_user_id_idx").on(table.userId),
    statusIdx: index("child_profiles_status_idx").on(table.status),
    friendCodeUnq: uniqueIndex("child_profiles_friend_code_unq").on(table.friendCode),
    friendCodeCheck: check("child_profiles_friend_code_check", sql`${table.friendCode} ~ '^[A-Z0-9]{8}$'`),
    valuesCheck: check("child_profiles_values_check", sql`${table.age} between 4 and 11 and ${table.level} > 0 and ${table.wordCount} >= 0 and ${table.streak} >= 0 and ${table.syncCursor} >= 0`),
    statusCheck: check("child_profiles_status_check", sql`${table.status} in ('activating','active','at_risk','paused')`),
  })
);

export const guardianLinks = pgTable(
  "guardian_links",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    guardianUserId: varchar("guardian_user_id", { length: 21 }).notNull().references(() => users.id),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    code: varchar("code", { length: 8 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    guardianIdx: index("guardian_links_guardian_idx").on(table.guardianUserId),
    childIdx: index("guardian_links_child_idx").on(table.childProfileId),
    pairUnq: uniqueIndex("guardian_links_pair_unq").on(table.guardianUserId, table.childProfileId),
    statusCheck: check("guardian_links_status_check", sql`${table.status} in ('pending','active','revoked')`),
  })
);

// ── 内容（课程/单元/关卡/题目） ────────────────────────────────────

export const courses = pgTable("courses", {
  id: varchar("id", { length: 21 }).primaryKey(),
  kind: varchar("kind", { length: 16 }).notNull(), // vocab | phonics
  title: varchar("title", { length: 128 }).notNull(),
  unitIds: json("unit_ids").notNull().$type<string[]>(),
}, table => [check("courses_kind_check", sql`${table.kind} in ('vocab','phonics')`)]);

export const units = pgTable(
  "units",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    courseId: varchar("course_id", { length: 21 }).notNull().references(() => courses.id),
    title: varchar("title", { length: 128 }).notNull(),
    order: integer("order").notNull(),
    stageIds: json("stage_ids").notNull().$type<string[]>(),
  },
  (table) => ({
    courseIdx: index("units_course_idx").on(table.courseId),
    orderCheck: check("units_order_check", sql`${table.order} > 0`),
  })
);

export const stages = pgTable(
  "stages",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    unitId: varchar("unit_id", { length: 21 }).notNull().references(() => units.id),
    title: varchar("title", { length: 128 }).notNull(),
    order: integer("order").notNull(),
    pointsReward: integer("points_reward").notNull().default(5),
  },
  (table) => ({
    unitIdx: index("stages_unit_idx").on(table.unitId),
    valuesCheck: check("stages_values_check", sql`${table.order} > 0 and ${table.pointsReward} >= 0`),
  })
);

export const stageProgress = pgTable(
  "stage_progress",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    stageId: varchar("stage_id", { length: 21 }).notNull().references(() => stages.id),
    status: varchar("status", { length: 16 }).notNull().default("locked"),
    completedStars: integer("completed_stars").notNull().default(0),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    childStageUnq: uniqueIndex("stage_progress_child_stage_unq").on(table.childProfileId, table.stageId),
    childIdx: index("stage_progress_child_idx").on(table.childProfileId),
    valuesCheck: check("stage_progress_values_check", sql`${table.version} > 0 and ${table.completedStars} >= 0`),
    statusCheck: check("stage_progress_status_check", sql`${table.status} in ('locked','unlocked','in_progress','completed')`),
  })
);

export const questions = pgTable(
  "questions",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    stageId: varchar("stage_id", { length: 21 }).notNull().references(() => stages.id),
    type: varchar("type", { length: 24 }).notNull(),
    difficulty: integer("difficulty").notNull(),
    targetWord: varchar("target_word", { length: 64 }).notNull(),
    promptAudioUrl: varchar("prompt_audio_url", { length: 512 }),
    imageAssetUrl: varchar("image_asset_url", { length: 512 }),
    options: json("options").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
  },
  (table) => ({
    stageIdx: index("questions_stage_idx").on(table.stageId),
    targetIdx: index("questions_target_word_idx").on(table.targetWord),
    valuesCheck: check("questions_values_check", sql`${table.difficulty} between 1 and 5 and ${table.correctIndex} >= 0 and ${table.correctIndex} < json_array_length(${table.options})`),
    typeCheck: check("questions_type_check", sql`${table.type} in ('picture_pick','spell','meaning_match','letter_sound','cvc','blend')`),
  })
);

// ── 学习事件 ─────────────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    stageId: varchar("stage_id", { length: 21 }).notNull().references(() => stages.id),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    durationSec: integer("duration_sec").default(0),
    currentIndex: integer("current_index").notNull().default(0),
    totalQuestions: integer("total_questions").notNull().default(0),
    earnedStars: integer("earned_stars").notNull().default(0),
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    childIdx: index("sessions_child_idx").on(table.childProfileId),
    valuesCheck: check("sessions_values_check", sql`${table.durationSec} >= 0 and ${table.currentIndex} >= 0 and ${table.currentIndex} <= ${table.totalQuestions} and ${table.earnedStars} >= 0 and ${table.version} > 0`),
  })
);

export const attempts = pgTable(
  "attempts",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    sessionId: varchar("session_id", { length: 21 }).notNull().references(() => sessions.id),
    questionId: varchar("question_id", { length: 21 }).notNull().references(() => questions.id),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    correct: boolean("correct").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    answeredAt: timestamp("answered_at").notNull(),
    selectedIndex: integer("selected_index").notNull().default(0),
    idempotencyKey: varchar("idempotency_key", { length: 160 }),
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    sessionIdx: index("attempts_session_idx").on(table.sessionId),
    childIdx: index("attempts_child_idx").on(table.childProfileId),
    questionIdx: index("attempts_question_idx").on(table.questionId),
    idempotencyIdx: uniqueIndex("attempts_idempotency_key_unq").on(table.idempotencyKey),
    valuesCheck: check("attempts_values_check", sql`${table.latencyMs} between 0 and 120000 and ${table.selectedIndex} >= 0 and ${table.version} > 0`),
  })
);

export const proficiencies = pgTable(
  "proficiencies",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    targetWord: varchar("target_word", { length: 64 }).notNull(),
    p: numeric("p", { precision: 5, scale: 4 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at").notNull(),
    firstMasteredAt: timestamp("first_mastered_at"),
  },
  (table) => ({
    childWordUnq: uniqueIndex("proficiencies_child_word_unq").on(
      table.childProfileId,
      table.targetWord
    ),
    valuesCheck: check("proficiencies_values_check", sql`${table.p} between 0 and 1 and ${table.attempts} >= 0`),
  })
);

// ── 对战 ─────────────────────────────────────────────────────────

export const battles = pgTable(
  "battles",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    mode: varchar("mode", { length: 16 }).notNull(), // ai | parent_async
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    opponentId: varchar("opponent_id", { length: 21 }).notNull(),
    stageId: varchar("stage_id", { length: 21 }).notNull().references(() => stages.id),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    winnerId: varchar("winner_id", { length: 21 }),
    baseDate: timestamp("base_date").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    childIdx: index("battles_child_idx").on(table.childProfileId),
    statusIdx: index("battles_status_idx").on(table.status),
    modeCheck: check("battles_mode_check", sql`${table.mode} in ('ai','parent_async')`),
    statusCheck: check("battles_status_check", sql`${table.status} in ('pending','invited','in_progress','finished','resolved','expired')`),
  })
);

export const battleRounds = pgTable(
  "battle_rounds",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    battleId: varchar("battle_id", { length: 21 }).notNull().references(() => battles.id),
    roundIndex: integer("round_index").notNull(),
    playerId: varchar("player_id", { length: 21 }).notNull(),
    questionId: varchar("question_id", { length: 21 }).notNull().references(() => questions.id),
    correct: boolean("correct").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    score: integer("score").notNull().default(0),
  },
  (table) => ({
    battleIdx: index("battle_rounds_battle_idx").on(table.battleId),
    roundUnq: uniqueIndex("battle_rounds_player_round_unq").on(table.battleId, table.playerId, table.roundIndex),
    valuesCheck: check("battle_rounds_values_check", sql`${table.roundIndex} between 1 and 3 and ${table.score} >= 0 and ${table.latencyMs} between 0 and 120000`),
  })
);

export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    period: varchar("period", { length: 12 }).notNull(), // week | all_time
    wins: integer("wins").notNull().default(0),
    score: integer("score").notNull().default(0),
    rank: integer("rank"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    periodChildUnq: uniqueIndex("leaderboard_period_child_unq").on(
      table.period,
      table.childProfileId
    ),
    valuesCheck: check("leaderboard_values_check", sql`${table.wins} >= 0 and ${table.score} >= 0 and (${table.rank} is null or ${table.rank} > 0)`),
    periodCheck: check("leaderboard_period_check", sql`${table.period} in ('week','all_time')`),
  })
);

// ── 奖励与收藏 ───────────────────────────────────────────────────

export const starWallets = pgTable(
  "star_wallets",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    balance: integer("balance").notNull().default(0),
    totalEarned: integer("total_earned").notNull().default(0),
  },
  (table) => ({
    childUnq: uniqueIndex("star_wallets_child_unq").on(table.childProfileId),
    valuesCheck: check("star_wallets_values_check", sql`${table.balance} >= 0 and ${table.totalEarned} >= ${table.balance}`),
  })
);

export const collectionItems = pgTable(
  "collection_items",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    kind: varchar("kind", { length: 16 }).notNull(), // character | badge
    itemKey: varchar("item_key", { length: 64 }).notNull(),
    itemName: varchar("item_name", { length: 64 }).notNull(),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  },
  (table) => ({
    childKindUnq: uniqueIndex("collection_child_kind_unq").on(
      table.childProfileId,
      table.kind,
      table.itemKey
    ),
    kindCheck: check("collection_kind_check", sql`${table.kind} in ('character','badge')`),
  })
);

// ── 报告与通知 ───────────────────────────────────────────────────

export const learningReports = pgTable(
  "learning_reports",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    period: varchar("period", { length: 8 }).notNull(), // week | month
    newWords: integer("new_words").notNull().default(0),
    totalTimeMin: integer("total_time_min").notNull().default(0),
    accuracy: numeric("accuracy", { precision: 5, scale: 4 }).notNull().default("0"),
    streak: integer("streak").notNull().default(0),
    aiSummary: text("ai_summary").notNull().default(""),
    summarySource: varchar("summary_source", { length: 16 }).notNull().default("template"),
    periodStart: timestamp("period_start"),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
  },
  (table) => ({
    childPeriodIdx: index("reports_child_period_idx").on(
      table.childProfileId,
      table.period
    ),
    periodUnq: uniqueIndex("reports_period_start_unq").on(table.childProfileId, table.period, table.periodStart),
    valuesCheck: check("reports_values_check", sql`${table.newWords} >= 0 and ${table.totalTimeMin} >= 0 and ${table.accuracy} between 0 and 1 and ${table.streak} >= 0`),
    periodCheck: check("reports_period_check", sql`${table.period} in ('week','month')`),
    sourceCheck: check("reports_summary_source_check", sql`${table.summarySource} in ('template','llm')`),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull().references(() => users.id),
    kind: varchar("kind", { length: 24 }).notNull(),
    payload: json("payload").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("queued"),
    triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    statusIdx: index("notifications_status_idx").on(table.status),
    statusCheck: check("notifications_status_check", sql`${table.status} in ('queued','sent','read')`),
    kindCheck: check("notifications_kind_check", sql`${table.kind} in ('daily_reminder','weekly_report','milestone','at_risk','encouragement')`),
  })
);

export const syncChanges = pgTable(
  "sync_changes",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
    entity: varchar("entity", { length: 48 }).notNull(),
    entityId: varchar("entity_id", { length: 160 }).notNull(),
    op: varchar("op", { length: 16 }).notNull(),
    version: integer("version").notNull(),
    cursor: integer("cursor").notNull(),
    deviceId: varchar("device_id", { length: 128 }).notNull(),
    payload: json("payload").notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    childVersionIdx: index("sync_changes_child_version_idx").on(table.childProfileId, table.cursor),
    entityVersionUnq: uniqueIndex("sync_changes_entity_version_unq").on(table.childProfileId, table.entity, table.entityId, table.version),
    cursorUnq: uniqueIndex("sync_changes_cursor_unq").on(table.childProfileId, table.cursor),
    valuesCheck: check("sync_changes_values_check", sql`${table.version} > 0 and ${table.cursor} > 0`),
    opCheck: check("sync_changes_op_check", sql`${table.op} in ('insert','update')`),
  })
);

export const syncReceipts = pgTable("sync_receipts", {
  id: text("id").notNull(), childProfileId: varchar("child_profile_id", { length: 21 }).notNull().references(() => childProfiles.id),
  fingerprint: text("fingerprint").notNull(), createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [uniqueIndex("sync_receipts_child_item_unq").on(table.childProfileId, table.id)]);

export const cronRuns = pgTable("cron_runs", {
  id: varchar("id", { length: 21 }).primaryKey(), task: text("task").notNull(), periodKey: text("period_key").notNull(),
  status: text("status").notNull(), startedAt: timestamp("started_at").notNull().defaultNow(), completedAt: timestamp("completed_at"),
  error: text("error"),
}, table => [uniqueIndex("cron_runs_task_period_unq").on(table.task, table.periodKey), check("cron_runs_status_check", sql`${table.status} in ('running','completed','failed')`)]);

export const cronAttempts = pgTable("cron_attempts", {
  id: varchar("id", { length: 21 }).primaryKey(), runId: varchar("run_id", { length: 21 }).notNull().references(() => cronRuns.id),
  status: text("status").notNull(), startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"), error: text("error"),
}, table => [index("cron_attempts_run_idx").on(table.runId), check("cron_attempts_status_check", sql`${table.status} in ('running','completed','failed')`)]);
