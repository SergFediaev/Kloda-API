import { lower } from 'db/utils'
import { relations } from 'drizzle-orm'
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import { cards } from './cards'
import { refreshTokens } from './refreshTokens'

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 256 }).unique().notNull(),
    email: text('email').unique().notNull(),
    hashedPassword: varchar('hashed_password', { length: 256 }).notNull(),
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at').notNull().defaultNow(),
  },
  table => ({
    usernameUniqueIndex: uniqueIndex('usernameUniqueIndex').on(
      lower(table.username),
    ),
    emailUniqueIndex: uniqueIndex('emailUniqueIndex').on(lower(table.email)),
  }),
)

// noinspection JSUnusedGlobalSymbols
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  cards: many(cards),
}))
