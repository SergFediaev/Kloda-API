export const getUptime = (nanoseconds: number) => {
  const ms = nanoseconds / 1_000_000
  const date = new Date(ms)

  const days = Math.floor(ms / (1_000 * 60 * 60 * 24))
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0')

  return { days, time: `${hours}:${minutes}:${seconds}.${milliseconds}` }
}
