import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  title: varchar('name', { length: 256 }).notNull(),
  content: text('content').notNull(),
  categories: varchar('categories', { length: 256 }).array().notNull(),
  likes: integer('likes').default(0).notNull(),
  dislikes: integer('dislikes').default(0).notNull(),
  authorId: varchar('author_id', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
