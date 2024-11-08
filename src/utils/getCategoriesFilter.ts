import { categories } from 'db'
import { inArray } from 'drizzle-orm'

export const getCategoriesFilter = (encodedCategories: string[]) => {
  const decodedCategories = encodedCategories.map(category =>
    decodeURIComponent(category),
  )

  return decodedCategories.length
    ? inArray(categories.name, decodedCategories)
    : undefined
}
