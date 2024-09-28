import { Elysia, t } from 'elysia'

export const userModel = t.Object({
  id: t.Number(),
  username: t.String(),
  email: t.String(),
  password: t.String(),
  createdCards: t.Array(t.String()),
  favoriteCards: t.Array(t.String()),
  likedCards: t.Array(t.String()),
  dislikedCards: t.Array(t.String()),
  registeredAt: t.Date(),
  lastLoginAt: t.Date(),
})

export const usersModel = new Elysia().model({
  usersResponse: t.Array(t.Omit(userModel, ['password'])),
})
