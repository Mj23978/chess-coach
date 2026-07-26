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
CREATE TABLE "database_games" (
	"database_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "database_games_database_id_game_id_pk" PRIMARY KEY ("database_id","game_id")
);
--> statement-breakpoint
CREATE INDEX "databases_created_at_idx" ON "databases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "database_games_database_idx" ON "database_games" USING btree ("database_id");--> statement-breakpoint
CREATE INDEX "database_games_game_idx" ON "database_games" USING btree ("game_id");
