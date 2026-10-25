CREATE TABLE "auth_accounts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_id" varchar(128),
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_runs" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"task" text NOT NULL,
	"period_key" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text,
	CONSTRAINT "cron_runs_status_check" CHECK ("cron_runs"."status" in ('running','completed','failed'))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sync_receipts" (
	"id" text NOT NULL,
	"child_profile_id" varchar(21) NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "guardian_links_code_unq";--> statement-breakpoint
DROP INDEX "child_profiles_user_id_idx";--> statement-breakpoint
DROP INDEX "sync_changes_child_version_idx";--> statement-breakpoint
DROP INDEX "sync_changes_entity_version_unq";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'guardian';--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "friend_code" varchar(8);--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "primary_device_id" varchar(128);--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "sync_cursor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_reports" ADD COLUMN "summary_source" varchar(16) DEFAULT 'template' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_reports" ADD COLUMN "period_start" timestamp;--> statement-breakpoint
ALTER TABLE "proficiencies" ADD COLUMN "first_mastered_at" timestamp;--> statement-breakpoint
ALTER TABLE "sync_changes" ADD COLUMN "cursor" integer;--> statement-breakpoint
WITH positions AS (SELECT id, row_number() OVER (PARTITION BY child_profile_id ORDER BY created_at, id)::integer AS position FROM sync_changes)
UPDATE sync_changes SET cursor = positions.position FROM positions WHERE sync_changes.id = positions.id;--> statement-breakpoint
UPDATE child_profiles SET sync_cursor = coalesce((SELECT max(cursor) FROM sync_changes WHERE child_profile_id = child_profiles.id), 0);--> statement-breakpoint
ALTER TABLE "sync_changes" ALTER COLUMN "cursor" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE users SET is_anonymous = true, email = id || '@anonymous.placeholder.invalid' WHERE role = 'child';--> statement-breakpoint
UPDATE child_profiles SET friend_code = upper(substr(md5(id), 1, 8));--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_receipts" ADD CONSTRAINT "sync_receipts_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_unq" ON "auth_accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "cron_runs_task_period_unq" ON "cron_runs" USING btree ("task","period_key");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_receipts_child_item_unq" ON "sync_receipts" USING btree ("child_profile_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_rounds_player_round_unq" ON "battle_rounds" USING btree ("battle_id","player_id","round_index");--> statement-breakpoint
CREATE UNIQUE INDEX "child_profiles_friend_code_unq" ON "child_profiles" USING btree ("friend_code");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_links_pair_unq" ON "guardian_links" USING btree ("guardian_user_id","child_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_period_start_unq" ON "learning_reports" USING btree ("child_profile_id","period","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_changes_cursor_unq" ON "sync_changes" USING btree ("child_profile_id","cursor");--> statement-breakpoint
CREATE UNIQUE INDEX "child_profiles_user_id_idx" ON "child_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_changes_child_version_idx" ON "sync_changes" USING btree ("child_profile_id","cursor");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_changes_entity_version_unq" ON "sync_changes" USING btree ("child_profile_id","entity","entity_id","version");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_values_check" CHECK ("attempts"."latency_ms" between 0 and 120000 and "attempts"."selected_index" >= 0 and "attempts"."version" > 0);--> statement-breakpoint
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_values_check" CHECK ("battle_rounds"."round_index" between 1 and 3 and "battle_rounds"."score" >= 0 and "battle_rounds"."latency_ms" between 0 and 120000);--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_mode_check" CHECK ("battles"."mode" in ('ai','parent_async'));--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_status_check" CHECK ("battles"."status" in ('pending','invited','in_progress','finished','resolved','expired'));--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_values_check" CHECK ("child_profiles"."age" between 4 and 11 and "child_profiles"."level" > 0 and "child_profiles"."word_count" >= 0 and "child_profiles"."streak" >= 0 and "child_profiles"."sync_cursor" >= 0);--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_status_check" CHECK ("child_profiles"."status" in ('activating','active','at_risk','paused'));--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_kind_check" CHECK ("courses"."kind" in ('vocab','phonics'));--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_status_check" CHECK ("guardian_links"."status" in ('pending','active','revoked'));--> statement-breakpoint
ALTER TABLE "learning_reports" ADD CONSTRAINT "reports_values_check" CHECK ("learning_reports"."new_words" >= 0 and "learning_reports"."total_time_min" >= 0 and "learning_reports"."accuracy" between 0 and 1 and "learning_reports"."streak" >= 0);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_status_check" CHECK ("notifications"."status" in ('queued','sent','read'));--> statement-breakpoint
ALTER TABLE "proficiencies" ADD CONSTRAINT "proficiencies_values_check" CHECK ("proficiencies"."p" between 0 and 1 and "proficiencies"."attempts" >= 0);--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_values_check" CHECK ("questions"."difficulty" between 1 and 5 and "questions"."correct_index" >= 0 and "questions"."correct_index" < json_array_length("questions"."options"));--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_type_check" CHECK ("questions"."type" in ('picture_pick','spell','meaning_match','letter_sound','cvc','blend'));--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_values_check" CHECK ("sessions"."duration_sec" >= 0 and "sessions"."current_index" >= 0 and "sessions"."current_index" <= "sessions"."total_questions" and "sessions"."earned_stars" >= 0 and "sessions"."version" > 0);--> statement-breakpoint
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_values_check" CHECK ("stage_progress"."version" > 0 and "stage_progress"."completed_stars" >= 0);--> statement-breakpoint
ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_status_check" CHECK ("stage_progress"."status" in ('locked','unlocked','in_progress','completed'));--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_values_check" CHECK ("stages"."order" > 0 and "stages"."points_reward" >= 0);--> statement-breakpoint
ALTER TABLE "star_wallets" ADD CONSTRAINT "star_wallets_values_check" CHECK ("star_wallets"."balance" >= 0 and "star_wallets"."total_earned" >= "star_wallets"."balance");--> statement-breakpoint
ALTER TABLE "sync_changes" ADD CONSTRAINT "sync_changes_values_check" CHECK ("sync_changes"."version" > 0 and "sync_changes"."cursor" > 0);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" in ('child', 'guardian'));
