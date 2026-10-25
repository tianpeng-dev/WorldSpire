CREATE TABLE "cron_attempts" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"run_id" varchar(21) NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text,
	CONSTRAINT "cron_attempts_status_check" CHECK ("cron_attempts"."status" in ('running','completed','failed'))
);
--> statement-breakpoint
ALTER TABLE "cron_attempts" ADD CONSTRAINT "cron_attempts_run_id_cron_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."cron_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cron_attempts_run_idx" ON "cron_attempts" USING btree ("run_id");