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

export const createCardModel = t.Omit(cardModel, [
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
])

export const encodedCategoriesModel = t.Array(t.String(), { default: [] })

// ToDo: Refactor cards models
export const cardsModels = new Elysia().model({
  card: t.Object({
    card: cardModel,
    cardPosition: t.Numeric(),
    prevCardId: t.Numeric(),
    nextCardId: t.Numeric(),
    totalCards: t.Numeric(),
  }),
  cards: t.Object({
    cards: t.Array(cardModel),
    totalCards: t.Numeric(),
    totalPages: t.Numeric(),
  }),
  edit: t.Omit(createCardModel, ['authorId']),
  update: t.Union([cardModel, messageModel]),
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
