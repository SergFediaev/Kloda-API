import jwt from '@elysiajs/jwt'
import { Elysia } from 'elysia'

const refreshSecret = process.env.JWT_REFRESH_SECRET

if (!refreshSecret) {
  throw Error('Missing JWT_REFRESH_SECRET')
}

const accessSecret = process.env.JWT_ACCESS_SECRET

if (!accessSecret) {
  throw Error('Missing JWT_ACCESS_SECRET')
}

export const jwtRefreshPlugin = new Elysia().use(
  jwt({
    name: 'jwtRefresh',
    secret: refreshSecret,
    exp: '10m',
  }),
)

export const jwtAccessPlugin = new Elysia().use(
  jwt({
    name: 'jwtAccess',
    secret: accessSecret,
    exp: '3m',
  }),
)
