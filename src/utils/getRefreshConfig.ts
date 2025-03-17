// const maxAge = 10 * 60 * 1_000 // 10 minutes
const maxAge = 60 * 1_000 // 1 minute

// ToDo: 10 min? Sync with JWT
export const getRefreshConfig = () => ({
  expiresAt: new Date(Date.now() + maxAge),
  refreshConfig: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/v1/auth/',
    maxAge,
  },
})
