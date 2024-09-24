import { Elysia, t } from 'elysia'

export const registerModel = new Elysia().model({
  registerBody: t.Object({
    username: t.String(),
    email: t.String(),
    password: t.String(),
  }),
  registerResponse: t.Union([
    t.Object({ accessToken: t.String() }),
    t.Object({ message: t.String() }),
  ]),
})
