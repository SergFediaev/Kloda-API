import { db, getUsersWithCardsCount, users } from 'db'
import { eq } from 'drizzle-orm'
import type { Elysia } from 'elysia'
import { jwtAccessPlugin } from './jwt'

const unauthorized = {
  success: false,
  message: 'Unauthorized',
  data: null,
}

export const authPlugin = (app: Elysia) =>
  app
    .use(jwtAccessPlugin)
    .derive(async ({ jwtAccess, set, request: { headers } }) => {
      const authorization = headers.get('Authorization')

      if (!authorization) {
        set.status = 401

        console.error('Authorization header not found')

        return { ...unauthorized }
      }

      const token = authorization.split(' ')[1]

      if (!token) {
        set.status = 401

        console.error('Access token not found')

        return unauthorized
      }

      const payload = await jwtAccess.verify(token)

      if (!payload) {
        set.status = 401

        console.error('Invalid access token')

        return unauthorized
      }

      const userId = payload.sub

      if (!userId) {
        set.status = 401

        console.error('User ID not found')

        return unauthorized
      }

      const [user] = await getUsersWithCardsCount(db).where(
        eq(users.id, Number(userId)),
      )

      if (!user) {
        set.status = 401

        console.error('User not found')

        return unauthorized
      }

      return { user }
    })
