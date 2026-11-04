CREATE TYPE "public"."project_context" AS ENUM('client', 'personal', 'academic', 'internship');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('live', 'completed', 'coming_soon', 'in_progress');--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"url" text NOT NULL,
	"public_id" text NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"title" varchar(120) NOT NULL,
	"title_en" varchar(120),
	"title_es" varchar(120),
	"title_ar" varchar(120),
	"subtitle" varchar(200),
	"subtitle_en" varchar(200),
	"subtitle_es" varchar(200),
	"subtitle_ar" varchar(200),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "summary_en" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "summary_es" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "summary_ar" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "features" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "features_en" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "features_es" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "features_ar" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights_en" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights_es" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights_ar" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "categories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" "project_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "context" "project_context";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_section_id_project_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."project_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_images_section_idx" ON "project_images" USING btree ("section_id","order");--> statement-breakpoint
CREATE INDEX "project_sections_project_idx" ON "project_sections" USING btree ("project_id","order");--> statement-breakpoint
-- Reprise : chaque projet garde sa catégorie actuelle dans la nouvelle liste.
UPDATE "projects" SET "categories" = jsonb_build_array("category"::text) WHERE "categories" = '[]'::jsonb;