CREATE TABLE IF NOT EXISTS "disliked_cards" (
	"user_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"liked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disliked_cards_user_id_card_id_pk" PRIMARY KEY("user_id","card_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorite_cards" (
	"user_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_cards_user_id_card_id_pk" PRIMARY KEY("user_id","card_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "liked_cards" (
	"user_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"liked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "liked_cards_user_id_card_id_pk" PRIMARY KEY("user_id","card_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disliked_cards" ADD CONSTRAINT "disliked_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disliked_cards" ADD CONSTRAINT "disliked_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_cards" ADD CONSTRAINT "favorite_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_cards" ADD CONSTRAINT "favorite_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_cards" ADD CONSTRAINT "liked_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_cards" ADD CONSTRAINT "liked_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "created_cards";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "favorite_cards";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "liked_cards";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "disliked_cards";