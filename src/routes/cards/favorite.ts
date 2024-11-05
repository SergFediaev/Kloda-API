import { cards, db, decrement, favoriteCards, increment } from 'db'
import { and, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { cardsModels, idModel } from 'models'
import { authorizePlugin } from 'plugins'

export const favoriteRoute = new Elysia()
  .use(cardsModels)
  .use(authorizePlugin)
  .patch(
    ':id/favorite',
    async ({ params: { id }, user, set }) => {
      if (!user) {
        set.status = 401

        console.error('User not found')

        return { message: 'Unauthorized' }
      }

      return db.transaction(async tx => {
        const userId = user.id

        const existingFavorite = await tx.query.favoriteCards.findFirst({
          where: and(
            eq(favoriteCards.userId, userId),
            eq(favoriteCards.cardId, id),
          ),
        })

        if (existingFavorite) {
          await tx
            .delete(favoriteCards)
            .where(
              and(
                eq(favoriteCards.userId, userId),
                eq(favoriteCards.cardId, id),
              ),
            )

          await tx
            .update(cards)
            .set({ favorites: decrement(cards.favorites) })
            .where(eq(cards.id, id))

          return { isFavorite: false }
        }

        await tx.insert(favoriteCards).values({ userId, cardId: id })

        await tx
          .update(cards)
          .set({ favorites: increment(cards.favorites) })
          .where(eq(cards.id, id))

        return { isFavorite: true }
      })
    },
    {
      params: idModel,
      response: 'favorite',
    },
  )
