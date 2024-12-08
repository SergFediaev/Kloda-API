import { relations } from 'drizzle-orm'
import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { cardsToCategories } from './cardsToCategories'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).unique().notNull(),
  displayName: varchar('display_name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// noinspection JSUnusedGlobalSymbols
export const categoriesRelations = relations(categories, ({ many }) => ({
  cards: many(cardsToCategories),
}))
