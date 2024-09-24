CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(256) NOT NULL,
	"email" text NOT NULL,
	"password" varchar(256) NOT NULL,
	"created_cards" varchar(256)[] NOT NULL,
	"favorite_cards" varchar(256)[] NOT NULL,
	"liked_cards" varchar(256)[] NOT NULL,
	"disliked_cards" varchar(256)[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
