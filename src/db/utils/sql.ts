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
import { type SQL, and, asc, desc, eq, getTableColumns, sql } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

type CardsStatusTable =
  | typeof favoriteCards
  | typeof likedCards
  | typeof dislikedCards

type CardsTable = typeof cards | CardsStatusTable

export const lower = (value: PgColumn): SQL => sql`LOWER(${value})`

export const increment = (column: PgColumn, value = 1): SQL =>
  sql`${column} + ${value}`

export const decrement = (column: PgColumn, value = 1): SQL =>
  sql`${column} - ${value}`

export const countCards = (table: CardsTable, column: PgColumn): SQL<number> =>
  sql<number>`(SELECT COUNT(*) FROM ${table} WHERE ${column} = ${users.id})::INT`

export const getOrder = (order: 'asc' | 'desc') =>
  order === 'asc' ? asc : desc

export const getUserCardsCount = () =>
  ({
    createdCardsCount: countCards(cards, cards.authorId),
    favoriteCardsCount: countCards(favoriteCards, favoriteCards.userId),
    likedCardsCount: countCards(likedCards, likedCards.userId),
    dislikedCardsCount: countCards(dislikedCards, dislikedCards.userId),
  }) as const

const getCardStatus = (table: CardsStatusTable, userId?: number) =>
  userId
    ? sql<boolean>`COALESCE(BOOL_OR(${table.userId} = ${userId}), FALSE)`
    : sql<boolean>`FALSE`

export const getCards = (database: Database, userId?: number) => {
  const cardsWithCategories = database
    .select({
      ...getTableColumns(cards),
      categories: sql<string[]>`ARRAY_AGG(${categories.displayName})`,
      isFavorite: getCardStatus(favoriteCards, userId),
      isLiked: getCardStatus(likedCards, userId),
      isDisliked: getCardStatus(dislikedCards, userId),
      authorUsername: sql<string>`${users.username}`,
    })
    .from(cards)
    .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
    .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
    .leftJoin(users, eq(users.id, cards.authorId))
    .groupBy(cards.id, users.username)

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
