import { Elysia, t } from 'elysia'

export const queryModel = new Elysia().model({
  idParams: t.Object({
    id: t.Numeric(),
  }),
})
