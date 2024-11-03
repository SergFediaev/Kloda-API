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
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  sql,
} from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

type CardsStatusTable =
  | typeof favoriteCards
  | typeof likedCards
  | typeof dislikedCards

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

const getCardStatus = (table: CardsStatusTable, userId?: number) =>
  userId
    ? sql<boolean>`coalesce(bool_or(${table.userId} = ${userId}), false)`
    : sql<boolean>`false`

export const getCards = (database: Database, userId?: number) => {
  const cardsWithCategories = database
    .select({
      ...getTableColumns(cards),
      categories: sql<string[]>`array_agg(${categories.displayName})`,
      isFavorite: getCardStatus(favoriteCards, userId),
      isLiked: getCardStatus(likedCards, userId),
      isDisliked: getCardStatus(dislikedCards, userId),
    })
    .from(cards)
    .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
    .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
    .groupBy(cards.id)

  if (userId) {
    cardsWithCategories
      .leftJoin(
        favoriteCards,
        and(
          eq(favoriteCards.userId, userId),
          eq(favoriteCards.cardId, cards.id),
        ),
      )
      .leftJoin(
        likedCards,
        and(eq(likedCards.userId, userId), eq(likedCards.cardId, cards.id)),
      )
      .leftJoin(
        dislikedCards,
        and(
          eq(dislikedCards.userId, userId),
          eq(dislikedCards.cardId, cards.id),
        ),
      )
  }

  return cardsWithCategories
}

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
