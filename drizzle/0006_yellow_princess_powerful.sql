CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" varchar(256) NOT NULL,
	"hashed_token" varchar(256),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "password" TO "hashed_password";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "refresh_token";