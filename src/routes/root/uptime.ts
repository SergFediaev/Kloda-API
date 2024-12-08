import { Elysia } from 'elysia'
import type { Nullable } from 'types'
import { getUptime } from 'utils'

// noinspection JSUnusedGlobalSymbols
export const uptimeRoute = new Elysia()
  .state('timer', null as Nullable<Timer>)
  .ws('uptime', {
    open(ws) {
      const sendUptime = () => ws.send(getUptime(Bun.nanoseconds()))

      ws.data.store.timer = setInterval(sendUptime, 1)
    },
    close(ws) {
      if (ws.data.store.timer) {
        clearInterval(ws.data.store.timer)
        ws.data.store.timer = null
      }

      ws.close()
    },
  })
