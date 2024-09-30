import swagger from '@elysiajs/swagger'
import { Elysia } from 'elysia'

export const docsPlugin = new Elysia().use(
  swagger({
    documentation: {
      info: {
        title: 'Kloda API documentation',
        version: '1.0.0',
      },
    },
  }),
)
