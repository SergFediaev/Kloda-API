import { Elysia, t } from 'elysia'
import { userModel } from './users.model'

export const registerModel = new Elysia().model({
  registerBody: t.Omit(userModel, [
    'id',
    'createdCards',
    'favoriteCards',
    'likedCards',
    'dislikedCards',
    'registeredAt',
    'lastLoginAt',
  ]),
  registerResponse: t.Union([
    t.Object({
      accessToken: t.String(),
      userId: t.Number(),
    }),
    t.Object({
      message: t.String(),
    }),
  ]),
  registerCookie: t.Cookie({
    refreshToken: t.Optional(t.String()),
  }),
})
