CREATE TABLE "simulated_server_status" (
	"id" text PRIMARY KEY NOT NULL,
	"online_players" integer NOT NULL,
	"experience_rate" integer NOT NULL,
	"drop_rate" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"news" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
