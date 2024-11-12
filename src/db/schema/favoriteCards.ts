import { relations } from 'drizzle-orm'
import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { cards, users } from './'

export const favoriteCards = pgTable(
  'favorite_cards',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  ({ userId, cardId }) => ({
    primaryKey: primaryKey({ columns: [userId, cardId] }),
  }),
)

export const favoriteCardsRelations = relations(favoriteCards, ({ one }) => ({
  user: one(users, {
    fields: [favoriteCards.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [favoriteCards.cardId],
    references: [cards.id],
  }),
}))
