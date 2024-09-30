const maxAge = 10 * 60 * 1_000 // 10 minutes

export const getRefreshConfig = () => ({
  expiresAt: new Date(Date.now() + maxAge),
  refreshConfig: {
    httpOnly: true,
    secure: true,
    path: '/v1/auth/',
    maxAge,
  },
})
