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
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
