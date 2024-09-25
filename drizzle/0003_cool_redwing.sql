ALTER TABLE "users" RENAME COLUMN "created_at" TO "registered_at";--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "likes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "dislikes" SET DEFAULT 0;