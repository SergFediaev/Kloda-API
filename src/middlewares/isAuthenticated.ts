import jwt from '@elysiajs/jwt'
import { eq } from 'drizzle-orm'
import type { Elysia } from 'elysia'
import { users } from '../db/schemas/users'
import { db } from '../index'

const secret = process.env.JWT_SECRET

if (!secret) {
  throw Error('Missing JWT_SECRET')
}

const unauthorized = {
  success: false,
  message: 'Unauthorized',
  data: null,
}

export const isAuthenticated = (app: Elysia) =>
  app
    .use(jwt({ secret }))
    .derive(async ({ jwt, set, request: { headers } }) => {
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

      const payload = await jwt.verify(token)

      if (!payload) {
        set.status = 401

        console.error('Invalid access token')

        return unauthorized
      }

      const id = payload.sub

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))

      if (!user) {
        set.status = 401

        console.error('User not found')

        return unauthorized
      }

      return { user }
    })
