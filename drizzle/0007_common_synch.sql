ALTER TABLE "refresh_tokens" ALTER COLUMN "hashed_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "ip" varchar(256) NOT NULL;