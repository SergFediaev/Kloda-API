import { Elysia, t } from 'elysia'

export const registerModel = new Elysia().model({
  registerBody: t.Object({
    username: t.String(),
    email: t.String(),
    password: t.String(),
  }),
})
