CREATE TABLE "duel_answers" (
	"room_id" varchar(21) NOT NULL,
	"player_id" varchar(21) NOT NULL,
	"round_index" integer NOT NULL,
	"option_id" text NOT NULL,
	"latency_ms" integer NOT NULL,
	"score" integer NOT NULL,
	CONSTRAINT "duel_answers_values_check" CHECK ("duel_answers"."round_index" between 1 and 10 and "duel_answers"."latency_ms" between 0 and 9999 and "duel_answers"."score" >= 0)
);
--> statement-breakpoint
CREATE TABLE "duel_rooms" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"host_id" varchar(21) NOT NULL,
	"guest_id" varchar(21),
	"host_ready" boolean DEFAULT false NOT NULL,
	"guest_ready" boolean DEFAULT false NOT NULL,
	"host_seen_at" timestamp NOT NULL,
	"guest_seen_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"status" varchar(16) DEFAULT 'waiting' NOT NULL,
	"ended_reason" varchar(24),
	"stage_id" varchar(21) NOT NULL,
	"question_plan" json,
	"round_index" integer DEFAULT 1 NOT NULL,
	"round_started_at" timestamp,
	"winner_id" varchar(21),
	CONSTRAINT "duel_rooms_participants_check" CHECK ("duel_rooms"."host_id" <> "duel_rooms"."guest_id"),
	CONSTRAINT "duel_rooms_status_check" CHECK ("duel_rooms"."status" in ('waiting','playing','finished','closed')),
	CONSTRAINT "duel_rooms_round_check" CHECK ("duel_rooms"."round_index" between 1 and 10)
);
--> statement-breakpoint
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_room_id_duel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."duel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_answers" ADD CONSTRAINT "duel_answers_player_id_child_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_host_id_child_profiles_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_guest_id_child_profiles_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_rooms" ADD CONSTRAINT "duel_rooms_winner_id_child_profiles_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "duel_answers_player_round_unq" ON "duel_answers" USING btree ("room_id","round_index","player_id");