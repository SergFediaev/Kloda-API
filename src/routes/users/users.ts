import { db, users } from 'db'
import { eq, getTableColumns } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { idModel, usersModel } from 'models'

export const usersRoute = new Elysia({
  prefix: 'v1/users',
})
  .use(usersModel)
  .get(
    '',
    () => {
      const { hashedPassword, ...restUser } = getTableColumns(users)

      return db.select(restUser).from(users)
    },
    {
      response: 'users',
    },
  )
  .get(
    ':id',
    ({ params: { id } }) => {
      const { hashedPassword, ...restUser } = getTableColumns(users)

      return db.select(restUser).from(users).where(eq(users.id, id))
    },
    {
      params: idModel,
      response: 'users',
    },
  )
