CREATE TABLE "simulated_marketplace_listing" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"currency" text DEFAULT 'NC' NOT NULL,
	"price" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulated_marketplace_offer" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulated_marketplace_trade" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"currency" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_marketplace_trade_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
ALTER TABLE "simulated_marketplace_listing" ADD CONSTRAINT "simulated_marketplace_listing_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_marketplace_offer" ADD CONSTRAINT "simulated_marketplace_offer_listing_id_simulated_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."simulated_marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_marketplace_offer" ADD CONSTRAINT "simulated_marketplace_offer_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_marketplace_trade" ADD CONSTRAINT "simulated_marketplace_trade_listing_id_simulated_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."simulated_marketplace_listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_marketplace_trade" ADD CONSTRAINT "simulated_marketplace_trade_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_marketplace_trade" ADD CONSTRAINT "simulated_marketplace_trade_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;