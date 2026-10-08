CREATE TABLE "campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cta_label" text NOT NULL,
	"cta_href" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "campaign_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "operation_log" (
	"id" text PRIMARY KEY NOT NULL,
	"operation" text NOT NULL,
	"status" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
