import { relations, sql } from 'drizzle-orm'
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  title: varchar('name', { length: 256 }).notNull(),
  content: text('content').notNull(),
  categories: varchar('categories', { length: 256 })
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  likes: integer('likes').default(0).notNull(),
  dislikes: integer('dislikes').default(0).notNull(),
  authorId: integer('author_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const cardsRelations = relations(cards, ({ one }) => ({
  author: one(users, {
    fields: [cards.authorId],
    references: [users.id],
  }),
}))
