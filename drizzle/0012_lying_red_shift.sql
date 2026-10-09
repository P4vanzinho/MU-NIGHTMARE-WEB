CREATE TABLE "shop_product" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"currency" text NOT NULL,
	"price_cents" integer NOT NULL,
	"benefit" text NOT NULL,
	"eligibility" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "shop_product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "simulated_order" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol" text NOT NULL,
	"buyer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"currency" text NOT NULL,
	"price_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_order_protocol_unique" UNIQUE("protocol")
);
--> statement-breakpoint
CREATE TABLE "simulated_payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "simulated_payment_event_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "simulated_order" ADD CONSTRAINT "simulated_order_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_order" ADD CONSTRAINT "simulated_order_product_id_shop_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."shop_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulated_payment_event" ADD CONSTRAINT "simulated_payment_event_order_id_simulated_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."simulated_order"("id") ON DELETE cascade ON UPDATE no action;