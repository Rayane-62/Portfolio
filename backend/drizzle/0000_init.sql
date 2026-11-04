CREATE TYPE "public"."project_category" AS ENUM('web', 'mobile', 'desktop');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('frontend', 'backend', 'mobile', 'tools');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(60) NOT NULL,
	"last_name" varchar(60) DEFAULT '' NOT NULL,
	"login" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE "educations" (
	"id" serial PRIMARY KEY NOT NULL,
	"degree" varchar(200) NOT NULL,
	"degree_en" varchar(200),
	"degree_es" varchar(200),
	"degree_ar" varchar(200),
	"institution" varchar(200) NOT NULL,
	"institution_en" varchar(200),
	"institution_es" varchar(200),
	"institution_ar" varchar(200),
	"period" varchar(120) NOT NULL,
	"period_en" varchar(120),
	"period_es" varchar(120),
	"period_ar" varchar(120),
	"description" text,
	"description_en" text,
	"description_es" text,
	"description_ar" text,
	"current" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"position" varchar(160) NOT NULL,
	"position_en" varchar(160),
	"position_es" varchar(160),
	"position_ar" varchar(160),
	"company" varchar(160) NOT NULL,
	"company_en" varchar(160),
	"company_es" varchar(160),
	"company_ar" varchar(160),
	"period" varchar(120) NOT NULL,
	"period_en" varchar(120),
	"period_es" varchar(120),
	"period_ar" varchar(120),
	"description" text DEFAULT '' NOT NULL,
	"description_en" text,
	"description_es" text,
	"description_ar" text,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "info" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" varchar(120) DEFAULT '' NOT NULL,
	"name_ar" varchar(120),
	"title" varchar(160) DEFAULT '' NOT NULL,
	"title_en" varchar(160),
	"title_es" varchar(160),
	"title_ar" varchar(160),
	"bio" text DEFAULT '' NOT NULL,
	"bio_en" text,
	"bio_es" text,
	"bio_ar" text,
	"photo_url" text,
	"photo_public_id" text,
	"cv_url" text,
	"cv_public_id" text,
	"email" varchar(160) DEFAULT '' NOT NULL,
	"phone" varchar(30) DEFAULT '' NOT NULL,
	"whatsapp" varchar(30) DEFAULT '' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"stats_projects" integer DEFAULT 0 NOT NULL,
	"stats_experience" integer DEFAULT 0 NOT NULL,
	"stats_clients" integer DEFAULT 0 NOT NULL,
	"github" varchar(160),
	"linkedin" varchar(160),
	"instagram" varchar(160),
	"facebook" varchar(160),
	"x" varchar(160),
	"youtube" varchar(160),
	"behance" varchar(160),
	"dribbble" varchar(160),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(30),
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"title_en" varchar(160),
	"title_es" varchar(160),
	"title_ar" varchar(160),
	"description" text DEFAULT '' NOT NULL,
	"description_en" text,
	"description_es" text,
	"description_ar" text,
	"category" "project_category" NOT NULL,
	"technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"image_public_id" text,
	"live_url" text,
	"github_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"icon_url" text DEFAULT '' NOT NULL,
	"category" "skill_category" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "educations_order_idx" ON "educations" USING btree ("order");--> statement-breakpoint
CREATE INDEX "experiences_order_idx" ON "experiences" USING btree ("order");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_read_idx" ON "messages" USING btree ("read");--> statement-breakpoint
CREATE INDEX "projects_visible_idx" ON "projects" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "projects_order_idx" ON "projects" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_uniq" ON "skills" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");