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
  type SQL,
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  notExists,
  sql,
} from 'drizzle-orm'
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

export const aggregateCategories = () =>
  sql<
    string[]
  >`COALESCE(ARRAY_AGG(${categories.displayName}) FILTER (WHERE ${categories.id} IS NOT NULL), '{}')`

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
      categories: aggregateCategories(),
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

export const getCard = async (
  database: Database,
  cardId: number,
  userId?: number,
) => {
  const [card] = await getCards(database, userId).where(eq(cards.id, cardId))

  return card
}

// ToDo: Naming
export const getExistingCard = (
  database: Database,
  userId: number,
  cardId: number,
) =>
  database.query.cards.findFirst({
    where: and(eq(cards.authorId, userId), eq(cards.id, cardId)),
  })

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

export const insertCategories = async (
  database: Database,
  bodyCategories: string[],
  cardId: number,
) => {
  if (!bodyCategories.length) {
    return
  }

  const normalizedCategories = bodyCategories.map(displayName => ({
    name: displayName.toLowerCase(),
    displayName,
  }))

  await database
    .insert(categories)
    .values(normalizedCategories)
    .onConflictDoNothing()

  // ToDo: IDs naming
  const existingCategories = await database.query.categories.findMany({
    where: inArray(
      categories.name,
      normalizedCategories.map(({ name }) => name),
    ),
    columns: {
      id: true,
    },
  })

  const cardCategories = existingCategories.map(({ id: categoryId }) => ({
    cardId,
    categoryId,
  }))

  await database.insert(cardsToCategories).values(cardCategories)
}

export const deleteEmptyCategories = (database: Database) =>
  database
    .delete(categories)
    .where(
      notExists(
        database
          .select()
          .from(cardsToCategories)
          .where(eq(cardsToCategories.categoryId, categories.id)),
      ),
    )
