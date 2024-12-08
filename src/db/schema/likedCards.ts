import { relations } from 'drizzle-orm'
import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { cards, users } from './'

export const likedCards = pgTable(
  'liked_cards',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    likedAt: timestamp('liked_at').notNull().defaultNow(),
  },
  ({ userId, cardId }) => ({
    primaryKey: primaryKey({ columns: [userId, cardId] }),
  }),
)

// noinspection JSUnusedGlobalSymbols
export const likedCardsRelations = relations(likedCards, ({ one }) => ({
  user: one(users, {
    fields: [likedCards.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [likedCards.cardId],
    references: [cards.id],
  }),
}))
