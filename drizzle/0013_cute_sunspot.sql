CREATE TABLE "simulated_benefit_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"order_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"benefit" text NOT NULL,
	"status" text DEFAULT 'granted' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_benefit_grant_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "simulated_benefit_grant" ADD CONSTRAINT "simulated_benefit_grant_order_id_simulated_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."simulated_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_benefit_grant" ADD CONSTRAINT "simulated_benefit_grant_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;