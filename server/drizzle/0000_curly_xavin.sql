CREATE TYPE "public"."estimate_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('service', 'part');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'xendit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('submitted', 'received', 'inspected', 'awaiting_approval', 'in_progress', 'final_inspection', 'completed', 'handed_over', 'cancelled');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service_order_id" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"external_id" varchar(255),
	"payment_session_id" varchar(255),
	"payment_url" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_external_id_unique" UNIQUE("external_id"),
	CONSTRAINT "payments_payment_session_id_unique" UNIQUE("payment_session_id"),
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "service_order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service_order_id" integer NOT NULL,
	"service_id" integer,
	"item_type" "item_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	CONSTRAINT "service_order_items_quantity_check" CHECK ("service_order_items"."quantity" > 0),
	CONSTRAINT "service_order_items_unit_price_check" CHECK ("service_order_items"."unit_price" >= 0),
	CONSTRAINT "service_order_items_subtotal_check" CHECK ("service_order_items"."subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"complaint" text NOT NULL,
	"mileage" integer,
	"inspection_notes" text,
	"inspection_image_url" text,
	"estimated_total" numeric(12, 2),
	"final_total" numeric(12, 2),
	"estimate_status" "estimate_status" DEFAULT 'draft' NOT NULL,
	"status" "service_status" DEFAULT 'submitted' NOT NULL,
	"final_notes" text,
	"invoice_number" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_at" timestamp with time zone,
	"estimated_completion_at" timestamp with time zone,
	"estimate_approved_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"invoice_issued_at" timestamp with time zone,
	"handed_over_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	CONSTRAINT "service_orders_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "service_orders_mileage_check" CHECK ("service_orders"."mileage" IS NULL
          OR "service_orders"."mileage" >= 0),
	CONSTRAINT "service_orders_estimated_total_check" CHECK ("service_orders"."estimated_total" IS NULL
          OR "service_orders"."estimated_total" >= 0),
	CONSTRAINT "service_orders_final_total_check" CHECK ("service_orders"."final_total" IS NULL
          OR "service_orders"."final_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "service_updates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_updates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service_order_id" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"status" "service_status" NOT NULL,
	"notes" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"base_price" numeric(12, 2) NOT NULL,
	"reminder_interval_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_code_unique" UNIQUE("code"),
	CONSTRAINT "services_base_price_check" CHECK ("services"."base_price" >= 0),
	CONSTRAINT "services_reminder_interval_check" CHECK ("services"."reminder_interval_days" IS NULL
          OR "services"."reminder_interval_days" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"role_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vehicles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"brand" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_updates" ADD CONSTRAINT "service_updates_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_updates" ADD CONSTRAINT "service_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_paid_per_order" ON "payments" USING btree ("service_order_id") WHERE "payments"."status" = 'paid';