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
	title: varchar('name', { length: 256 }),
	content: text('content'),
	categories: varchar('categories', { length: 256 }).array(),
	likes: integer('likes'),
	dislikes: integer('dislikes'),
	author: varchar('author', { length: 256 }),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => sql`now()`),
})
