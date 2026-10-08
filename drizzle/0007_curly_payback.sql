ALTER TABLE "bug_report" ADD COLUMN "severity" text;--> statement-breakpoint
ALTER TABLE "bug_report" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "bug_report" ADD COLUMN "reward_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "bug_report" ADD COLUMN "reward_reason" text;--> statement-breakpoint
ALTER TABLE "bug_report" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "bug_report" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bug_report" ADD CONSTRAINT "bug_report_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;