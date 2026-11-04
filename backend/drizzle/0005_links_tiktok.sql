ALTER TABLE "info" ADD COLUMN "tiktok" varchar(160);--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "kind" "project_category";--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "play_store_url" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "app_store_url" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "download_url" text;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN "repos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "play_store_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "app_store_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "download_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Reprise : l'ancien lien GitHub devient le 1er dépôt.
UPDATE "projects" SET "repos" = jsonb_build_array(jsonb_build_object('label', '', 'url', "github_url")) WHERE "github_url" IS NOT NULL AND "repos" = '[]'::jsonb;--> statement-breakpoint
UPDATE "project_sections" SET "repos" = jsonb_build_array(jsonb_build_object('label', '', 'url', "github_url")) WHERE "github_url" IS NOT NULL AND "repos" = '[]'::jsonb;--> statement-breakpoint
-- Reprise : les plateformes deviennent un type (web, mobile ou logiciel).
UPDATE "project_sections" SET "kind" = (CASE
  WHEN "platforms" ? 'web' THEN 'web'
  WHEN "platforms" ?| array['android', 'ios'] THEN 'mobile'
  WHEN "platforms" ? 'desktop' THEN 'desktop'
END)::"project_category" WHERE "kind" IS NULL AND jsonb_array_length("platforms") > 0;
