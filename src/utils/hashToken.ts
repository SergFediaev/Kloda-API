export const hashToken = (token: string) =>
  new Bun.CryptoHasher('sha512').update(token).digest('hex')
