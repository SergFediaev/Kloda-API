import { relations } from 'drizzle-orm'
import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { cards, users } from './'

export const dislikedCards = pgTable(
  'disliked_cards',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id),
    dislikedAt: timestamp('disliked_at').notNull().defaultNow(),
  },
  ({ userId, cardId }) => ({
    primaryKey: primaryKey({ columns: [userId, cardId] }),
  }),
)

export const dislikedCardsRelations = relations(dislikedCards, ({ one }) => ({
  user: one(users, {
    fields: [dislikedCards.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [dislikedCards.cardId],
    references: [cards.id],
  }),
}))
