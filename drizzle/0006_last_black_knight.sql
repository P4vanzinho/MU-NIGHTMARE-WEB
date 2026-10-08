CREATE TABLE "bug_report" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol" text NOT NULL,
	"reporter_id" text NOT NULL,
	"title" text NOT NULL,
	"steps" text NOT NULL,
	"impact" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bug_report_protocol_unique" UNIQUE("protocol")
);
--> statement-breakpoint
ALTER TABLE "bug_report" ADD CONSTRAINT "bug_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;