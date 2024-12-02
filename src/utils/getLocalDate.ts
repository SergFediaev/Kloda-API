export const getLocalDate = (date?: Date) =>
  (date ?? new Date()).toLocaleString('ru')
