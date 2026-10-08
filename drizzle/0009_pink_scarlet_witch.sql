CREATE TABLE "simulated_character" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"character_class" text NOT NULL,
	"level" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulated_event" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"multiplier" integer,
	CONSTRAINT "simulated_event_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "simulated_player_wallet" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"nightmare_coins" integer DEFAULT 0 NOT NULL,
	"vip_level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulated_vault_item" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"location" text DEFAULT 'vault' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulated_character" ADD CONSTRAINT "simulated_character_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_player_wallet" ADD CONSTRAINT "simulated_player_wallet_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_vault_item" ADD CONSTRAINT "simulated_vault_item_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;