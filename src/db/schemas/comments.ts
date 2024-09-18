import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { cards } from './cards'

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').references(() => cards.id),
  content: text('content'),
  author: varchar('author', { length: 256 }),
  createdAt: timestamp('created_at').defaultNow(),
})
