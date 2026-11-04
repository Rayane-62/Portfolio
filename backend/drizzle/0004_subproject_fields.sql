ALTER TABLE "project_sections" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "summary_en" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "summary_es" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "summary_ar" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "status" "project_status";--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "highlights" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "highlights_en" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "highlights_es" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "highlights_ar" text;