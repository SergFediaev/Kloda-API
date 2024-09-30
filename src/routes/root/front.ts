import { Elysia } from 'elysia'

export const frontRoute = new Elysia().get('front', ({ redirect }) =>
  redirect('https://kloda.fediaev.ru'),
)
