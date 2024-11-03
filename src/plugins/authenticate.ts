import { db, getUsersWithCardsCount, users } from 'db'
import { eq } from 'drizzle-orm'
import type { Elysia } from 'elysia'
import { jwtAccessPlugin } from './jwt'

const ANONYMOUS = { user: undefined } as const

export const authenticatePlugin = (app: Elysia) =>
  app
    .use(jwtAccessPlugin)
    .derive(async ({ jwtAccess, request: { headers } }) => {
      const authorization = headers.get('Authorization')

      if (!authorization) {
        return ANONYMOUS
      }

      const token = authorization.split(' ')[1]

      if (!token) {
        return ANONYMOUS
      }

      const payload = await jwtAccess.verify(token)

      if (!payload) {
        return ANONYMOUS
      }

      const userId = payload.sub

      if (!userId) {
        return ANONYMOUS
      }

      const [user] = await getUsersWithCardsCount(db).where(
        eq(users.id, Number(userId)),
      )

      return { user: user ?? undefined }
    })
