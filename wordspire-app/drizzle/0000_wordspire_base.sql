CREATE TABLE "attempts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"session_id" varchar(21) NOT NULL,
	"question_id" varchar(21) NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"correct" boolean NOT NULL,
	"latency_ms" integer NOT NULL,
	"answered_at" timestamp NOT NULL,
	"selected_index" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(160),
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_rounds" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"battle_id" varchar(21) NOT NULL,
	"round_index" integer NOT NULL,
	"player_id" varchar(21) NOT NULL,
	"question_id" varchar(21) NOT NULL,
	"correct" boolean NOT NULL,
	"latency_ms" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"mode" varchar(16) NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"opponent_id" varchar(21) NOT NULL,
	"stage_id" varchar(21) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"winner_id" varchar(21),
	"base_date" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"age" integer NOT NULL,
	"grade" varchar(16) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'activating' NOT NULL,
	"last_active_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"item_key" varchar(64) NOT NULL,
	"item_name" varchar(64) NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"kind" varchar(16) NOT NULL,
	"title" varchar(128) NOT NULL,
	"unit_ids" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardian_links" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"guardian_user_id" varchar(21) NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"code" varchar(8) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"period" varchar(12) NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_reports" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"period" varchar(8) NOT NULL,
	"new_words" integer DEFAULT 0 NOT NULL,
	"total_time_min" integer DEFAULT 0 NOT NULL,
	"accuracy" numeric(5, 4) DEFAULT '0' NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"ai_summary" text DEFAULT '' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"payload" json NOT NULL,
	"status" varchar(16) DEFAULT 'queued' NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proficiencies" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"target_word" varchar(64) NOT NULL,
	"p" numeric(5, 4) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"stage_id" varchar(21) NOT NULL,
	"type" varchar(24) NOT NULL,
	"difficulty" integer NOT NULL,
	"target_word" varchar(64) NOT NULL,
	"prompt_audio_url" varchar(512),
	"image_asset_url" varchar(512),
	"options" json NOT NULL,
	"correct_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"stage_id" varchar(21) NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_sec" integer DEFAULT 0,
	"current_index" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"earned_stars" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_progress" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"stage_id" varchar(21) NOT NULL,
	"status" varchar(16) DEFAULT 'locked' NOT NULL,
	"completed_stars" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"unit_id" varchar(21) NOT NULL,
	"title" varchar(128) NOT NULL,
	"order" integer NOT NULL,
	"points_reward" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "star_wallets" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_changes" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"entity" varchar(48) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"op" varchar(16) NOT NULL,
	"version" integer NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"payload" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"course_id" varchar(21) NOT NULL,
	"title" varchar(128) NOT NULL,
	"order" integer NOT NULL,
	"stage_ids" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"role" varchar(16) NOT NULL,
	"nickname" varchar(64) NOT NULL,
	"avatar_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardian_user_id_users_id_fk" FOREIGN KEY ("guardian_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_reports" ADD CONSTRAINT "learning_reports_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proficiencies" ADD CONSTRAINT "proficiencies_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_wallets" ADD CONSTRAINT "star_wallets_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_changes" ADD CONSTRAINT "sync_changes_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_session_idx" ON "attempts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attempts_child_idx" ON "attempts" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "attempts_question_idx" ON "attempts" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_idempotency_key_unq" ON "attempts" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "battle_rounds_battle_idx" ON "battle_rounds" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "battles_child_idx" ON "battles" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "battles_status_idx" ON "battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "child_profiles_user_id_idx" ON "child_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "child_profiles_status_idx" ON "child_profiles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_child_kind_unq" ON "collection_items" USING btree ("child_profile_id","kind","item_key");--> statement-breakpoint
CREATE INDEX "guardian_links_guardian_idx" ON "guardian_links" USING btree ("guardian_user_id");--> statement-breakpoint
CREATE INDEX "guardian_links_child_idx" ON "guardian_links" USING btree ("child_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_links_code_unq" ON "guardian_links" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_period_child_unq" ON "leaderboard_entries" USING btree ("period","child_profile_id");--> statement-breakpoint
CREATE INDEX "reports_child_period_idx" ON "learning_reports" USING btree ("child_profile_id","period");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "proficiencies_child_word_unq" ON "proficiencies" USING btree ("child_profile_id","target_word");--> statement-breakpoint
CREATE INDEX "questions_stage_idx" ON "questions" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "questions_target_word_idx" ON "questions" USING btree ("target_word");--> statement-breakpoint
CREATE INDEX "sessions_child_idx" ON "sessions" USING btree ("child_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stage_progress_child_stage_unq" ON "stage_progress" USING btree ("child_profile_id","stage_id");--> statement-breakpoint
CREATE INDEX "stage_progress_child_idx" ON "stage_progress" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "stages_unit_idx" ON "stages" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "star_wallets_child_unq" ON "star_wallets" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "sync_changes_child_version_idx" ON "sync_changes" USING btree ("child_profile_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_changes_entity_version_unq" ON "sync_changes" USING btree ("entity_id","version");--> statement-breakpoint
CREATE INDEX "units_course_idx" ON "units" USING btree ("course_id");