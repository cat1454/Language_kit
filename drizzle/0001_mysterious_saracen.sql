ALTER TABLE "chunks" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "error_log" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_packs" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_attempts" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_inputs" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_outputs" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "retry_drills" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "roleplay_turns" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD COLUMN "user_id" integer DEFAULT 1 NOT NULL;