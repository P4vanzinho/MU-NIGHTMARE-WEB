CREATE TABLE "simulated_item_transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol" text NOT NULL,
	"source_owner_id" text NOT NULL,
	"target_owner_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_item_transfer_protocol_unique" UNIQUE("protocol")
);
--> statement-breakpoint
ALTER TABLE "simulated_item_transfer" ADD CONSTRAINT "simulated_item_transfer_source_owner_id_user_id_fk" FOREIGN KEY ("source_owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_item_transfer" ADD CONSTRAINT "simulated_item_transfer_target_owner_id_user_id_fk" FOREIGN KEY ("target_owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;