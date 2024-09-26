ALTER TABLE "comments" RENAME COLUMN "author" TO "author_id";--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "categories" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "author_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_cards" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "favorite_cards" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "liked_cards" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "disliked_cards" SET DEFAULT '{}'::text[];