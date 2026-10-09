CREATE TABLE "simulated_cash_dispute" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "simulated_cash_dispute_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "simulated_cash_order" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"gross_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"seller_net_cents" integer NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"reservation_expires_at" timestamp with time zone NOT NULL,
	"contestation_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_cash_order_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "simulated_cash_payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_cash_payment_event_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "simulated_cash_payout" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'held' NOT NULL,
	"requested_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	CONSTRAINT "simulated_cash_payout_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "simulated_seller_balance" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"pending_cents" integer DEFAULT 0 NOT NULL,
	"available_cents" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulated_seller_payment_account" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text DEFAULT 'mercado_pago' NOT NULL,
	"status" text DEFAULT 'not_connected' NOT NULL,
	"external_reference" text,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_seller_payment_account_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
ALTER TABLE "simulated_cash_dispute" ADD CONSTRAINT "simulated_cash_dispute_order_id_simulated_cash_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."simulated_cash_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_dispute" ADD CONSTRAINT "simulated_cash_dispute_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_order" ADD CONSTRAINT "simulated_cash_order_listing_id_simulated_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."simulated_marketplace_listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_order" ADD CONSTRAINT "simulated_cash_order_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_order" ADD CONSTRAINT "simulated_cash_order_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_payment_event" ADD CONSTRAINT "simulated_cash_payment_event_order_id_simulated_cash_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."simulated_cash_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_payout" ADD CONSTRAINT "simulated_cash_payout_order_id_simulated_cash_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."simulated_cash_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_cash_payout" ADD CONSTRAINT "simulated_cash_payout_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_seller_balance" ADD CONSTRAINT "simulated_seller_balance_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_seller_payment_account" ADD CONSTRAINT "simulated_seller_payment_account_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;