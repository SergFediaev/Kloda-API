import { relations } from 'drizzle-orm'
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { cardsToCategories, users } from './'

// ToDo: Refactor card name to title
export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  title: varchar('name', { length: 256 }).notNull(),
  content: text('content').notNull(),
  favorites: integer('favorites').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  dislikes: integer('dislikes').default(0).notNull(),
  authorId: integer('author_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const cardsRelations = relations(cards, ({ one, many }) => ({
  author: one(users, {
    fields: [cards.authorId],
    references: [users.id],
  }),
  categories: many(cardsToCategories),
}))
