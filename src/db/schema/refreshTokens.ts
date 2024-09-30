import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'

// ToDo: Revoke
export const refreshTokens = pgTable('refresh_tokens', {
  key: serial('key').primaryKey(),
  id: varchar('id', { length: 256 }).notNull(),
  hashedToken: varchar('hashed_token', { length: 256 }).notNull(),
  ip: varchar('ip', { length: 256 }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ToDo: Relations
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}))
