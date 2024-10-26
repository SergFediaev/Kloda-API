import {
  db,
  getOrder,
  getUserCardsCount,
  getUsersWithCardsCount,
  users,
} from 'db'
import { count, eq, getTableColumns, ilike, or } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { idModel, userModel, userResponseModel, usersModel } from 'models'

const USER_SORTS = {
  ...(({ hashedPassword, ...restUser }) => restUser)(getTableColumns(users)),
  ...getUserCardsCount(),
} as const

export const usersRoute = new Elysia({
  prefix: 'v1/users',
})
  .use(usersModel)
  .get(
    '',
    async ({ query: { search, page, limit, order, sort } }) => {
      const orderBy = getOrder(order)
      const decodedSearch = decodeURIComponent(search)

      const searchFilter = decodedSearch
        ? or(
            ilike(users.username, `%${decodedSearch}%`),
            ilike(users.email, `%${decodedSearch}%`),
          )
        : undefined

      const findUsers = getUsersWithCardsCount(db)
        .orderBy(orderBy(USER_SORTS[sort] ?? users.registeredAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const countUsers = db.select({ totalUsers: count() }).from(users)

      if (searchFilter) {
        findUsers.where(searchFilter)
        countUsers.where(searchFilter)
      }

      const foundUsers = await findUsers
      const [{ totalUsers }] = await countUsers
      const totalPages = Math.ceil(totalUsers / limit)

      return {
        users: foundUsers,
        totalUsers,
        totalPages,
      }
    },
    {
      response: 'users',
      // ToDo: Refactor duplicated types
      query: t.Object({
        search: t.String({ default: '' }),
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 }),
        order: t.Union([t.Literal('asc'), t.Literal('desc')], {
          default: 'desc',
        }),
        sort: t.KeyOf(t.Omit(userModel, ['password']), {
          default: 'registeredAt',
        }),
      }),
    },
  )
  .get(
    ':id',
    async ({ params: { id } }) => {
      const [user] = await getUsersWithCardsCount(db).where(eq(users.id, id))

      return user
    },
    {
      params: idModel,
      response: userResponseModel,
    },
  )
