import {
  cards,
  cardsToCategories,
  categories,
  db,
  dislikedCards,
  favoriteCards,
  likedCards,
  users,
} from 'db'
import { count, eq, exists, isNull } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { statsModel } from 'models'

export const statsRoute = new Elysia({ prefix: 'v1/stats' }).get(
  '',
  async () => {
    const [{ totalUsers }] = await db
      .select({
        totalUsers: count(),
      })
      .from(users)

    const [{ totalCards }] = await db
      .select({
        totalCards: count(),
      })
      .from(cards)

    const [{ totalCategories }] = await db
      .select({
        totalCategories: count(),
      })
      .from(categories)

    const [{ totalCategorized }] = await db
      .select({
        totalCategorized: count(),
      })
      .from(cards)
      .where(
        exists(
          db
            .select()
            .from(cardsToCategories)
            .where(eq(cardsToCategories.cardId, cards.id)),
        ),
      )

    const [{ totalUncategorized }] = await db
      .select({
        totalUncategorized: count(),
      })
      .from(cards)
      .leftJoin(cardsToCategories, eq(cards.id, cardsToCategories.cardId))
      .where(isNull(cardsToCategories.cardId))

    const [{ totalFavorite }] = await db
      .select({
        totalFavorite: count(),
      })
      .from(favoriteCards)

    const [{ totalLiked }] = await db
      .select({
        totalLiked: count(),
      })
      .from(likedCards)

    const [{ totalDisliked }] = await db
      .select({
        totalDisliked: count(),
      })
      .from(dislikedCards)

    return {
      totalUsers,
      totalCards,
      totalCategories,
      totalCategorized,
      totalUncategorized,
      totalFavorite,
      totalLiked,
      totalDisliked,
    }
  },
  { response: statsModel },
)
