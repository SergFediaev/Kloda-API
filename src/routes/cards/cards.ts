import {
  cards,
  cardsToCategories,
  categories,
  db,
  dislikedCards,
  favoriteCards,
  getCardWithCategories,
  likedCards,
} from 'db'
import {
  type SQL,
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { cardModel, cardsModels, idModel } from 'models'
import { dislikeRoute } from './dislike'
import { likeRoute } from './like'

const ACTION_TABLES = {
  favorite: favoriteCards,
  liked: likedCards,
  disliked: dislikedCards,
} as const

export const cardsRoute = new Elysia({
  prefix: 'v1/cards',
})
  .use(cardsModels)
  .use(likeRoute)
  .use(dislikeRoute)
  .get(
    '',
    async ({
      query: {
        search,
        page,
        limit,
        order,
        sort,
        categories: queryCategories,
        user,
        action,
      },
    }) => {
      const orderBy = order === 'asc' ? asc : desc
      const decodedSearch = decodeURIComponent(search)
      const decodedCategories = queryCategories.map(category =>
        decodeURIComponent(category),
      ) // ToDo: Normalize all filters from query

      const searchFilter = decodedSearch
        ? or(
            ilike(cards.title, `%${decodedSearch}%`),
            ilike(cards.content, `%${decodedSearch}%`),
          )
        : undefined

      const categoriesFilter = decodedCategories.length
        ? inArray(categories.name, decodedCategories)
        : undefined

      const filters: SQL[] = []

      if (searchFilter) filters.push(searchFilter)

      if (categoriesFilter) filters.push(categoriesFilter)

      if (user && action) {
        if (action === 'created') filters.push(eq(cards.authorId, user))
        else if (ACTION_TABLES[action]) {
          const table = ACTION_TABLES[action]

          filters.push(
            exists(
              db
                .select()
                .from(table)
                .where(and(eq(table.userId, user), eq(table.cardId, cards.id))),
            ),
          )
        }
      }

      const filter = filters.length ? and(...filters) : undefined

      const findCards = db
        .select({
          ...getTableColumns(cards),
          categories: sql<string[]>`array_agg(${categories.displayName})`,
        })
        .from(cards)
        .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
        .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
        .groupBy(cards.id)
        .orderBy(orderBy(cards[sort]))
        .limit(limit)
        .offset((page - 1) * limit)

      const countCards = db
        .select({ totalCards: count() })
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
      response: 'cards',
      query: t.Object({
        search: t.String({ default: '' }),
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 }),
        order: t.Union([t.Literal('asc'), t.Literal('desc')], {
          default: 'desc',
        }),
        sort: t.KeyOf(t.Omit(cardModel, ['categories']), {
          default: 'createdAt',
        }),
        categories: t.Array(t.String(), { default: [] }),
        user: t.Optional(t.Numeric()),
        action: t.Optional(
          t.Union([
            t.Literal('created'),
            t.Literal('favorite'),
            t.Literal('liked'),
            t.Literal('disliked'),
          ]),
        ),
      }), // ToDo: Refactor query model
    },
  )
  .get(
    ':id',
    async ({ params: { id } }) => {
      const [card] = await getCardWithCategories(db, id)
      return card
    },
    {
      params: idModel,
      response: cardModel,
    },
  )
  .post(
    '',
    ({ body: { categories: bodyCategories, ...restBody } }) =>
      db.transaction(async tx => {
        const [{ cardId }] = await tx
          .insert(cards)
          .values(restBody)
          .returning({ cardId: cards.id })

        const normalizedCategories = bodyCategories.map(displayName => ({
          name: displayName.toLowerCase(),
          displayName,
        }))

        await tx
          .insert(categories)
          .values(normalizedCategories)
          .onConflictDoNothing()

        const existingCategories = await tx.query.categories.findMany({
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

        await tx.insert(cardsToCategories).values(cardCategories)

        const [createdCard] = await getCardWithCategories(tx, cardId)

        return createdCard
      }),
    {
      body: 'create',
      response: cardModel,
    },
  )
