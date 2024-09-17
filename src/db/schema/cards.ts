import { sql } from 'drizzle-orm'
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core'

export const cards = pgTable('cards', {
	id: serial('id').primaryKey(),
	title: varchar('name', { length: 256 }).notNull(),
	content: text('content').notNull(),
	categories: varchar('categories', { length: 256 }).array().notNull(),
	likes: integer('likes').notNull(),
	dislikes: integer('dislikes').notNull(),
	author: varchar('author', { length: 256 }).notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
})
