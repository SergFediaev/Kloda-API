import { Elysia, t } from 'elysia'

// ToDo: Refactor format: 'email', password min/maxLength
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

export const userResponseModel = t.Omit(userModel, ['password'])

export const usersModel = new Elysia().model({
  users: t.Array(userResponseModel),
})
