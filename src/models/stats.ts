import { t } from 'elysia'

export const statsModel = t.Object({
  totalUsers: t.Number(),
  totalCards: t.Number(),
  totalCategories: t.Number(),
  totalCategorized: t.Number(),
  totalUncategorized: t.Number(),
  totalFavorite: t.Number(),
  totalLiked: t.Number(),
  totalDisliked: t.Number(),
})
