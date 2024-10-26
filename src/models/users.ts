import { Elysia, t } from 'elysia'

// ToDo: Refactor format: 'email', password min/maxLength
export const userModel = t.Object({
  id: t.Number(),
  username: t.String(),
  email: t.String(),
  password: t.String(),
  createdCardsCount: t.Number(),
  favoriteCardsCount: t.Number(),
  likedCardsCount: t.Number(),
  dislikedCardsCount: t.Number(),
  registeredAt: t.Date(),
  lastLoginAt: t.Date(),
})

export const userResponseModel = t.Omit(userModel, ['password'])

export const usersModel = new Elysia().model({
  users: t.Object({
    users: t.Array(userResponseModel),
    totalUsers: t.Numeric(),
    totalPages: t.Numeric(),
  }),
})
