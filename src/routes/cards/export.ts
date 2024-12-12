import { stringify } from 'csv-stringify'
import {
  aggregateCategories,
  cards,
  cardsToCategories,
  categories,
  db,
} from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { authorizePlugin } from 'plugins'
import { getLocalDate } from 'utils'

export const exportRoute = new Elysia()
  .use(authorizePlugin)
  .get('export', async ({ user, set }) => {
    if (!user) {
      set.status = 401

      console.error('User not found')

      return { message: 'Unauthorized' }
    }

    const userCards = await db
      .select({
        id: cards.id,
        title: cards.title,
        content: cards.content,
        createdAt: cards.createdAt,
        updatedAt: cards.updatedAt,
        categories: aggregateCategories(),
      })
      .from(cards)
      .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
      .leftJoin(categories, eq(categories.id, cardsToCategories.categoryId))
      .where(eq(cards.authorId, user.id))
      .groupBy(cards.id)

    if (!userCards.length) {
      set.status = 404
      const message = 'Cards not found'

      console.error(message)

      return { message }
    }

    try {
      // noinspection Annotator
      const csvCards = await new Promise<string>((resolve, reject) =>
        stringify(
          userCards.map(
            ({ id, title, content, categories, createdAt, updatedAt }) => ({
              ID: id,
              Title: title,
              Content: content,
              'Comma-separated categories': categories.join(', '),
              'Created at': getLocalDate(createdAt),
              'Updated at': getLocalDate(updatedAt),
            }),
          ),
          { header: true },
          (error, output) => {
            if (error) reject(error)

            resolve(output)
          },
        ),
      )

      const filename = `Kloda - ${user.username} created cards (${getLocalDate()}).csv`

      return new Response(csvCards, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error) {
      set.status = 500
      const message = `Error converting ${user.username} cards to CSV: ${error}`

      console.error(message)

      return { message }
    }
  })
