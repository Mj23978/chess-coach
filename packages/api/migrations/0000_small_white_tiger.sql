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
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX "games_created_at_idx" ON "games" USING btree ("created_at");