import { Elysia, t } from 'elysia'
import { userModel, userResponseModel } from './users'

const accessToken = t.String()

const messageModel = t.Object({
  message: t.String(),
})

export const authModels = new Elysia().model({
  auth: t.Union([
    t.Object({
      accessToken,
      userId: t.Number(),
    }),
    messageModel,
  ]),
  register: t.Omit(userModel, [
    'id',
    'createdCards',
    'favoriteCards',
    'likedCards',
    'dislikedCards',
    'registeredAt',
    'lastLoginAt',
  ]),
  login: t.Omit(userModel, [
    'id',
    'username',
    'createdCards',
    'favoriteCards',
    'likedCards',
    'dislikedCards',
    'registeredAt',
    'lastLoginAt',
  ]),
  refresh: t.Union([t.Object({ accessToken }), messageModel]),
  me: t.Union([userResponseModel, messageModel]),
  cookie: t.Cookie({
    refreshToken: t.Optional(t.String()),
  }),
})
