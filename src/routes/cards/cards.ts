import {
  cards,
  cardsToCategories,
  categories,
  db,
  deleteEmptyCategories,
  dislikedCards,
  favoriteCards,
  getCard,
  getCards,
  getExistingCard,
  getOrder,
  insertCategories,
  likedCards,
} from 'db'
import {
  type SQL,
  and,
  countDistinct,
  eq,
  exists,
  ilike,
  or,
  sql,
} from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import {
  cardModel,
  cardsModels,
  createCardModel,
  encodedCategoriesModel,
  idModel,
  messageModel,
} from 'models'
import { authenticatePlugin, authorizePlugin } from 'plugins'
import type { Nullable } from 'types'
import { getCategoriesFilter } from 'utils'
import { dislikeRoute } from './dislike'
import { exportRoute } from './export'
import { favoriteRoute } from './favorite'
import { importRoute } from './import'
import { likeRoute } from './like'
import { randomRoute } from './random'

const ACTION_TABLES = {
  favorite: favoriteCards,
  liked: likedCards,
  disliked: dislikedCards,
} as const

const UNAUTHORIZED = { message: 'Unauthorized' } as const

const logUserError = () => console.error('User not found')

export const cardsRoute = new Elysia({
  prefix: 'v1/cards',
})
  .use(cardsModels)
  .use(authenticatePlugin)
  .use(favoriteRoute)
  .use(likeRoute)
  .use(dislikeRoute)
  .use(randomRoute)
  .use(importRoute)
  .use(exportRoute)
  .get(
    '',
    async ({
      query: {
        search,
        page,
        limit,
        order,
        sort,
        categories: encodedCategories,
        userId,
        action,
      },
      user,
    }) => {
      const decodedSearch = decodeURIComponent(search)
      const orderBy = getOrder(order)
      const categoriesFilter = getCategoriesFilter(encodedCategories)
      // ToDo: Normalize all filters from query

      const searchFilter = decodedSearch
        ? or(
            ilike(cards.title, `%${decodedSearch}%`),
            ilike(cards.content, `%${decodedSearch}%`),
          )
        : undefined

      const filters: SQL[] = []

      if (searchFilter) filters.push(searchFilter)

      if (categoriesFilter) filters.push(categoriesFilter)

      if (userId && action) {
        if (action === 'created') filters.push(eq(cards.authorId, userId))
        else if (ACTION_TABLES[action]) {
          const table = ACTION_TABLES[action]

          filters.push(
            exists(
              db
                .select()
                .from(table)
                .where(
                  and(eq(table.userId, userId), eq(table.cardId, cards.id)),
                ),
            ),
          )
        }
      }

      const filter = filters.length ? and(...filters) : undefined

      const findCards = getCards(db, user?.id)
        .orderBy(orderBy(cards[sort]))
        .limit(limit)
        .offset((page - 1) * limit)

      const countCards = db
        .select({ totalCards: countDistinct(cards.id) })
        .from(cards)
        .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
        .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))

      if (filter) {
        findCards.where(filter)
        countCards.where(filter)
      }

      const foundCards = await findCards
      const [{ totalCards }] = await countCards
      const totalPages = Math.ceil(totalCards / limit)

      return {
        cards: foundCards,
        totalCards,
        totalPages,
      }
    },
    {
      query: t.Object({
        search: t.String({ default: '' }),
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 }),
        order: t.Union([t.Literal('asc'), t.Literal('desc')], {
          default: 'desc',
        }),
        sort: t.KeyOf(
          t.Omit(cardModel, [
            'categories',
            'isFavorite',
            'isLiked',
            'isDisliked',
            'authorUsername',
          ]),
          {
            default: 'createdAt',
          },
        ),
        categories: encodedCategoriesModel,
        userId: t.Optional(t.Numeric()),
        action: t.Optional(
          t.Union([
            t.Literal('created'),
            t.Literal('favorite'),
            t.Literal('liked'),
            t.Literal('disliked'),
          ]),
        ),
      }), // ToDo: Refactor query model
      response: 'cards',
    },
  )
  .get(
    ':id',
    async ({
      params: { id },
      query: { categories: encodedCategories },
      user,
    }) => {
      const findCards = db
        .select({
          cardId: cards.id,
          cardPosition: sql<number>`ROW_NUMBER() OVER(ORDER BY ${cards.id})`,
          prevCard: sql<
            Nullable<number>
          >`LAG(${cards.id}) OVER(ORDER BY ${cards.id})`,
          nextCard: sql<
            Nullable<number>
          >`LEAD(${cards.id}) OVER(ORDER BY ${cards.id})`,
        })
        .from(cards)
        .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
        .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
        .orderBy(cards.id)
        .groupBy(cards.id)

      const categoriesFilter = getCategoriesFilter(encodedCategories)

      if (categoriesFilter) findCards.where(categoriesFilter)

      const foundCards = await findCards
      const foundCard = foundCards.find(({ cardId }) => cardId === id)
      const firstCard = foundCards[0]
      const { cardId, cardPosition, prevCard, nextCard } =
        foundCard ?? firstCard

      const card = await getCard(db, cardId, user?.id)
      const totalCards = foundCards.length
      const prevCardId = prevCard ?? foundCards[totalCards - 1].cardId
      const nextCardId = nextCard ?? firstCard.cardId

      return {
        card,
        cardPosition,
        prevCardId,
        nextCardId,
        totalCards,
      }
    },
    {
      params: idModel,
      query: t.Object({
        categories: encodedCategoriesModel,
      }),
      response: 'card',
    },
  )
  .use(authorizePlugin)
  .post(
    '',
    ({ body: { categories: bodyCategories, ...restBody }, user, set }) => {
      if (!user) {
        set.status = 401
        logUserError()
        return UNAUTHORIZED
      }

      return db.transaction(async tx => {
        const [{ cardId }] = await tx
          .insert(cards)
          .values(restBody)
          .returning({ cardId: cards.id })

        await insertCategories(tx, bodyCategories, cardId)

        return await getCard(tx, cardId, user.id)
      })
    },
    {
      body: createCardModel,
      response: 'update',
    },
  )
  .patch(
    ':id',
    ({
      params: { id },
      body: { categories: bodyCategories, ...restBody },
      user,
      set,
    }) => {
      if (!user) {
        set.status = 401
        logUserError()
        return UNAUTHORIZED
      }

      return db.transaction(async tx => {
        const existingCard = await getExistingCard(tx, user.id, id)

        if (!existingCard) {
          set.status = 404
          const message = `Card ID ${id} not found`

          console.error(message)

          return { message }
        }

        await tx.update(cards).set(restBody).where(eq(cards.id, id))

        await tx
          .delete(cardsToCategories)
          .where(eq(cardsToCategories.cardId, id))

        await insertCategories(tx, bodyCategories, id)

        await deleteEmptyCategories(tx)

        return await getCard(tx, id, user.id)
      })
    },
    {
      params: idModel,
      body: 'edit',
      response: 'update',
    },
  )
  .delete(
    '',
    ({ user, set }) => {
      if (!user) {
        set.status = 401
        logUserError()
        return UNAUTHORIZED
      }

      return db.transaction(async tx => {
        const existingCards = await tx
          .select()
          .from(cards)
          .where(eq(cards.authorId, user.id))

        if (!existingCards.length) {
          set.status = 404
          const message = 'Cards not found'

          console.error(message)

          return { message }
        }

        const deletedCards = await tx
          .delete(cards)
          .where(eq(cards.authorId, user.id))
          .returning()

        await deleteEmptyCategories(tx)

        return { deletedCardsCount: deletedCards.length }
      })
    },
    {
      response: t.Union([
        t.Object({
          deletedCardsCount: t.Number(),
        }),
        messageModel,
      ]),
    },
  )
  .delete(
    ':id',
    ({ params: { id }, user, set }) => {
      if (!user) {
        set.status = 401
        logUserError()
        return UNAUTHORIZED
      }

      return db.transaction(async tx => {
        const existingCard = await getExistingCard(tx, user.id, id)

        if (!existingCard) {
          set.status = 404
          const message = `Card ID ${id} not found`

          console.error(message)

          return { message }
        }

        await tx.delete(cards).where(eq(cards.id, id))

        await deleteEmptyCategories(tx)

        return { message: `Card ID ${id} deleted` }
      })
    },
    {
      params: idModel,
      response: messageModel,
    },
  )
