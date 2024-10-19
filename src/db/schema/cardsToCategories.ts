import { relations } from 'drizzle-orm'
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { cards, categories } from './'

export const cardsToCategories = pgTable(
  'cards_to_categories',
  {
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
  },
  ({ cardId, categoryId }) => ({
    primaryKey: primaryKey({ columns: [cardId, categoryId] }),
  }),
)

export const cardsToCategoriesRelations = relations(
  cardsToCategories,
  ({ one }) => ({
    card: one(cards, {
      fields: [cardsToCategories.cardId],
      references: [cards.id],
    }),
    category: one(categories, {
      fields: [cardsToCategories.categoryId],
      references: [categories.id],
    }),
  }),
)
