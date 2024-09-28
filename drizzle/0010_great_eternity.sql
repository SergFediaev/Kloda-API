ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "ip" DROP NOT NULL;