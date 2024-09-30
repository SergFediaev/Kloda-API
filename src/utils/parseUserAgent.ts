import { UAParser } from 'ua-parser-js'

export const parseUserAgent = (headers: Headers) => {
  const header = headers.get('User-Agent') ?? undefined
  const parser = new UAParser(header)

  return JSON.stringify(parser.getResult())
}
