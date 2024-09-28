import { Elysia, t } from 'elysia'
import { userModel } from './users.model'

export const loginModel = new Elysia().model({
  loginBody: t.Omit(userModel, [
    'id',
    'username',
    'createdCards',
    'favoriteCards',
    'likedCards',
    'dislikedCards',
    'registeredAt',
    'lastLoginAt',
  ]),
  loginResponse: t.Union([
    t.Object({
      accessToken: t.String(),
      userId: t.Number(),
    }),
    t.Object({
      message: t.String(),
    }),
  ]),
})
