import type { Database } from 'db'
import { cards, cardsToCategories, categories } from 'db/schema'
import { type AnyColumn, type SQL, eq, getTableColumns, sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const lower = (value: AnyPgColumn): SQL => sql`lower(${value})`

export const increment = (column: AnyColumn, value = 1): SQL =>
  sql`${column} + ${value}`

export const decrement = (column: AnyColumn, value = 1): SQL =>
  sql`${column} - ${value}`

export const getCardWithCategories = async (
  database: Database,
  cardId: number,
) =>
  database
    .select({
      ...getTableColumns(cards),
      categories: sql<string[]>`array_agg(${categories.displayName})`,
    })
    .from(cards)
    .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
    .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
    .where(eq(cards.id, cardId))
    .groupBy(cards.id)
