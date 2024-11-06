import { Elysia, t } from 'elysia'
import { messageModel } from './message'

export const cardModel = t.Object({
  id: t.Number(),
  title: t.String(),
  content: t.String(),
  categories: t.Array(t.String()),
  favorites: t.Number(),
  likes: t.Number(),
  dislikes: t.Number(),
  authorId: t.Number(),
  authorUsername: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  isFavorite: t.Boolean(),
  isLiked: t.Boolean(),
  isDisliked: t.Boolean(),
})

// ToDo: Refactor cards models
export const cardsModels = new Elysia().model({
  cards: t.Object({
    cards: t.Array(cardModel),
    totalCards: t.Numeric(),
    totalPages: t.Numeric(),
  }),
  create: t.Omit(cardModel, [
    'id',
    'favorites',
    'likes',
    'dislikes',
    'authorUsername',
    'createdAt',
    'updatedAt',
    'isFavorite',
    'isLiked',
    'isDisliked',
  ]),
  favorite: t.Union([
    t.Object({
      isFavorite: t.Boolean(),
    }),
    messageModel,
  ]),
  like: t.Union([
    t.Object({
      isLiked: t.Boolean(),
    }),
    messageModel,
  ]),
  dislike: t.Union([
    t.Object({
      isDisliked: t.Boolean(),
    }),
    messageModel,
  ]),
})
