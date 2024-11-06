DROP INDEX IF EXISTS "usernameUniqueIndex";--> statement-breakpoint
DROP INDEX IF EXISTS "emailUniqueIndex";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usernameUniqueIndex" ON "users" USING btree (LOWER("username"));--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emailUniqueIndex" ON "users" USING btree (LOWER("email"));