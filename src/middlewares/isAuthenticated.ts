import jwt from '@elysiajs/jwt'
import { eq } from 'drizzle-orm'
import type { Elysia } from 'elysia'
import { users } from '../db/schemas/users.schema'
import { db } from '../index'

const accessSecret = process.env.JWT_ACCESS_SECRET

if (!accessSecret) {
  throw Error('Missing JWT_ACCESS_SECRET')
}

const unauthorized = {
  success: false,
  message: 'Unauthorized',
  data: null,
}

// ToDo: Refactor JWT
export const isAuthenticated = (app: Elysia) =>
  app
    .use(jwt({ name: 'jwtAccess', secret: accessSecret, exp: '5m' }))
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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))

      if (!user) {
        set.status = 401

        console.error('User not found')

        return unauthorized
      }

      return { user }
    })
