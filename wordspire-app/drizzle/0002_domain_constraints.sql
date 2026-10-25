ALTER TABLE "child_profiles" ALTER COLUMN "friend_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_friend_code_check" CHECK ("child_profiles"."friend_code" ~ '^[A-Z0-9]{8}$');--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_kind_check" CHECK ("collection_items"."kind" in ('character','badge'));--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_values_check" CHECK ("leaderboard_entries"."wins" >= 0 and "leaderboard_entries"."score" >= 0 and ("leaderboard_entries"."rank" is null or "leaderboard_entries"."rank" > 0));--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_period_check" CHECK ("leaderboard_entries"."period" in ('week','all_time'));--> statement-breakpoint
ALTER TABLE "learning_reports" ADD CONSTRAINT "reports_period_check" CHECK ("learning_reports"."period" in ('week','month'));--> statement-breakpoint
ALTER TABLE "learning_reports" ADD CONSTRAINT "reports_summary_source_check" CHECK ("learning_reports"."summary_source" in ('template','llm'));--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_kind_check" CHECK ("notifications"."kind" in ('daily_reminder','weekly_report','milestone','at_risk','encouragement'));--> statement-breakpoint
ALTER TABLE "sync_changes" ADD CONSTRAINT "sync_changes_op_check" CHECK ("sync_changes"."op" in ('insert','update'));--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_order_check" CHECK ("units"."order" > 0);