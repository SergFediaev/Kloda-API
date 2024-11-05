import { Elysia, t } from 'elysia'
import { messageModel } from './message'

export const cardStatusModels = new Elysia().model({
  isFavorite: t.Union([
    t.Object({
      isFavorite: t.Boolean(),
    }),
    messageModel,
  ]),
  isLiked: t.Union([
    t.Object({
      isLiked: t.Boolean(),
    }),
    messageModel,
  ]),
  isDisliked: t.Union([
    t.Object({
      isDisliked: t.Boolean(),
    }),
    messageModel,
  ]),
})
