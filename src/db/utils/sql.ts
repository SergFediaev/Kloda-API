import type { Database } from 'db'
import {
  cards,
  cardsToCategories,
  categories,
  dislikedCards,
  favoriteCards,
  likedCards,
  users,
} from 'db/schema'
import {
  type AnyColumn,
  type SQL,
  asc,
  desc,
  eq,
  getTableColumns,
  sql,
} from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const lower = (value: AnyPgColumn): SQL => sql`lower(${value})`

export const increment = (column: AnyColumn, value = 1): SQL =>
  sql`${column} + ${value}`

export const decrement = (column: AnyColumn, value = 1): SQL =>
  sql`${column} - ${value}`

export const getOrder = (order: 'asc' | 'desc') =>
  order === 'asc' ? asc : desc

export const getUserCardsCount = () =>
  ({
    createdCardsCount: sql<number>`count(${cards.authorId})::int`,
    favoriteCardsCount: sql<number>`count(${favoriteCards.userId})::int`,
    likedCardsCount: sql<number>`count(${likedCards.userId})::int`,
    dislikedCardsCount: sql<number>`count(${dislikedCards.userId})::int`,
  }) as const

export const getCardsWithCategories = (database: Database) =>
  database
    .select({
      ...getTableColumns(cards),
      categories: sql<string[]>`array_agg(${categories.displayName})`,
    })
    .from(cards)
    .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
    .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
    .groupBy(cards.id)

export const getUsersWithCardsCount = (database: Database) => {
  const { hashedPassword, ...restUser } = getTableColumns(users)

  return database
    .select({
      ...restUser,
      ...getUserCardsCount(),
    })
    .from(users)
    .leftJoin(cards, eq(cards.authorId, users.id))
    .leftJoin(favoriteCards, eq(favoriteCards.userId, users.id))
    .leftJoin(likedCards, eq(likedCards.userId, users.id))
    .leftJoin(dislikedCards, eq(dislikedCards.userId, users.id))
    .groupBy(users.id)
}
