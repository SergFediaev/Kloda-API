import {
  cards,
  cardsToCategories,
  categories,
  db,
  getCardWithCategories,
} from 'db'
import {
  and,
  asc,
  count,
  desc,
  eq,
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

export const cardsRoute = new Elysia({
  prefix: 'v1/cards',
})
  .use(cardsModels)
  .use(likeRoute)
  .use(dislikeRoute)
  .get(
    '',
    ({
      query: { search, page, limit, order, sort, categories: queryCategories },
    }) =>
      db.transaction(async tx => {
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

        const filters =
          searchFilter && categoriesFilter
            ? and(searchFilter, categoriesFilter)
            : searchFilter || categoriesFilter

        const foundCards = await tx
          .select({
            ...getTableColumns(cards),
            categories: sql<string[]>`array_agg(${categories.displayName})`,
          })
          .from(cards)
          .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
          .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
          .where(filters)
          .groupBy(cards.id)
          .orderBy(orderBy(cards[sort]))
          .limit(limit)
          .offset((page - 1) * limit)

        const [{ totalCards }] = await tx
          .select({ totalCards: count() })
          .from(cards)
          .where(filters)
          .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
          .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))

        const totalPages = Math.ceil(totalCards / limit)

        return {
          cards: foundCards,
          totalCards,
          totalPages,
        }
      }),
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
