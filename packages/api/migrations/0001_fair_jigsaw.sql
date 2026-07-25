CREATE TABLE "engines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" text,
	"path" text,
	"download_url" text,
	"exists" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"options" json DEFAULT '[]'::json,
	"elo" integer,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"username" text NOT NULL,
	"platform_user_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "source" text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "account_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_platform_username_idx" ON "accounts" USING btree ("platform","username");--> statement-breakpoint
CREATE INDEX "games_source_idx" ON "games" USING btree ("source");--> statement-breakpoint
CREATE INDEX "games_account_id_idx" ON "games" USING btree ("account_id");