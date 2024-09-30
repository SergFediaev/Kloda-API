import { Elysia } from 'elysia'
import logixlysia from 'logixlysia'

export const logPlugin = new Elysia().use(
  logixlysia({
    config: {
      ip: true,
      customLogFormat:
        '🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}',
    },
  }),
)
