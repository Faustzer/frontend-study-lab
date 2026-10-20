import { authApi, progressApi } from '../index'
import { server } from '@/mocks/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'

beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('progressApi', () => {
  it('fetches progress', async () => {
    const result = await progressApi.get()
    expect(result).toBeDefined()
    expect(result.xp).toBeTypeOf('number')
    expect(result.level).toBeTypeOf('number')
    expect(Array.isArray(result.completedModules)).toBe(true)
  })

  it('completes a module', async () => {
    const result = await progressApi.completeModule({
      moduleSlug: 'bind',
      xpReward: 60,
    })
    expect(result.xp).toBeGreaterThanOrEqual(60)
    expect(result.completedModules).toContain('bind')
  })

  it('completes a challenge', async () => {
    const result = await progressApi.completeChallenge({
      moduleSlug: 'bind',
      challengeId: 'test-1',
      xpReward: 20,
    })
    expect(result.xp).toBeGreaterThanOrEqual(20)
    expect(result.completedChallenges.bind).toContain('test-1')
  })

  it('handles server error on get', async () => {
    server.use(
      http.get('/api/progress', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    await expect(progressApi.get()).rejects.toThrow()
  })

  it('handles network error', async () => {
    server.use(
      http.get('/api/progress', () => {
        return HttpResponse.error()
      }),
    )
    await expect(progressApi.get()).rejects.toThrow()
  })
})

describe('authApi', () => {
  it('fetches current user', async () => {
    const user = await authApi.getMe()
    expect(user).toBeDefined()
    expect(user.id).toBeTypeOf('string')
    expect(user.email).toBeTypeOf('string')
    expect(user.displayName).toBeTypeOf('string')
  })

  it('logs out successfully', async () => {
    await expect(authApi.logout()).resolves.toBeDefined()
  })

  it('returns login url for provider', () => {
    const url = authApi.getLoginUrl('google')
    expect(url).toContain('/auth/google')
  })

  it('handles 401 when not authenticated', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return new HttpResponse(null, { status: 401 })
      }),
    )
    await expect(authApi.getMe()).rejects.toThrow()
  })

  it('handles server error on logout', async () => {
    server.use(
      http.post('/api/auth/logout', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )
    await expect(authApi.logout()).rejects.toThrow()
  })
})
