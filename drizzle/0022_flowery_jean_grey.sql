ALTER TABLE "cards_to_categories" DROP CONSTRAINT "cards_to_categories_card_id_cards_id_fk";
--> statement-breakpoint
ALTER TABLE "cards_to_categories" DROP CONSTRAINT "cards_to_categories_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "disliked_cards" DROP CONSTRAINT "disliked_cards_card_id_cards_id_fk";
--> statement-breakpoint
ALTER TABLE "favorite_cards" DROP CONSTRAINT "favorite_cards_card_id_cards_id_fk";
--> statement-breakpoint
ALTER TABLE "liked_cards" DROP CONSTRAINT "liked_cards_card_id_cards_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cards_to_categories" ADD CONSTRAINT "cards_to_categories_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cards_to_categories" ADD CONSTRAINT "cards_to_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disliked_cards" ADD CONSTRAINT "disliked_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_cards" ADD CONSTRAINT "favorite_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liked_cards" ADD CONSTRAINT "liked_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
