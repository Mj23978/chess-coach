CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"white" text,
	"black" text,
	"side" text,
	"result" text,
	"pgn" text NOT NULL,
	"analysis" json DEFAULT '[]'::json,
	"tags" text[],
	"source" text DEFAULT 'local' NOT NULL,
	"account_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "database_games" (
	"database_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "database_games_database_id_game_id_pk" PRIMARY KEY("database_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'games' NOT NULL,
	"description" text,
	"is_indexed" boolean DEFAULT false NOT NULL,
	"game_count" integer DEFAULT 0 NOT NULL,
	"storage_bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'games' NOT NULL,
	"description" text,
	"pgn" text NOT NULL,
	"game_count" integer DEFAULT 0 NOT NULL,
	"storage_bytes" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX "games_created_at_idx" ON "games" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "games_source_idx" ON "games" USING btree ("source");--> statement-breakpoint
CREATE INDEX "games_account_id_idx" ON "games" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_platform_username_idx" ON "accounts" USING btree ("platform","username");--> statement-breakpoint
CREATE INDEX "database_games_database_idx" ON "database_games" USING btree ("database_id");--> statement-breakpoint
CREATE INDEX "database_games_game_idx" ON "database_games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "databases_created_at_idx" ON "databases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "files_created_at_idx" ON "files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "files_type_idx" ON "files" USING btree ("type");