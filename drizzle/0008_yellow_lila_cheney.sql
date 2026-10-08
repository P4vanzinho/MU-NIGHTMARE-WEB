CREATE TABLE "simulated_player" (
	"id" text PRIMARY KEY NOT NULL,
	"public_slug" text NOT NULL,
	"name" text NOT NULL,
	"character_class" text NOT NULL,
	"level" integer NOT NULL,
	"score" integer NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_player_public_slug_unique" UNIQUE("public_slug")
);
