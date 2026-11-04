ALTER TABLE "project_sections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "description_es" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "features" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "features_en" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "features_es" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "features_ar" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "platforms" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "technologies" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "live_url" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "has_subprojects" boolean DEFAULT false NOT NULL;