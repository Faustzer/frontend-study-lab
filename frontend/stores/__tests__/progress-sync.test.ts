import type { UserProgress as RemoteProgress, User } from '@/api/types'
import { useAuthStore } from '../auth'
import { useProgressStore } from '../progress'
import { server } from '@/mocks/server'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'

const QUEUE_KEY = 'frontend-study-lab-progress-queue'

const testUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: '',
  provider: 'google',
  createdAt: new Date().toISOString(),
}

/**
 * Replaces default handlers with a controllable in-memory backend
 * and returns its state for assertions.
 */
function useFakeBackend(initial?: Partial<RemoteProgress>) {
  const state: RemoteProgress = {
    xp: 0,
    level: 1,
    completedModules: [],
    completedChallenges: {},
    ...initial,
  }
  const received: string[] = []

  server.use(
    http.get('/api/progress', () => HttpResponse.json({ data: state })),
    http.post('/api/progress/complete', async ({ request }) => {
      const body = await request.json() as { moduleSlug: string, xpReward: number }
      received.push(body.moduleSlug)
      if (!state.completedModules.includes(body.moduleSlug)) {
        state.completedModules.push(body.moduleSlug)
        state.xp += body.xpReward
      }
      return HttpResponse.json({ data: state })
    }),
    http.post('/api/progress/challenge/complete', async ({ request }) => {
      const body = await request.json() as { moduleSlug: string, challengeId: string, xpReward: number }
      received.push(`${body.moduleSlug}/${body.challengeId}`)
      if (!state.completedChallenges[body.moduleSlug])
        state.completedChallenges[body.moduleSlug] = []
      state.completedChallenges[body.moduleSlug].push(body.challengeId)
      return HttpResponse.json({ data: state })
    }),
  )

  return { state, received }
}

function useOfflineBackend() {
  server.use(
    http.get('/api/progress', () => HttpResponse.error()),
    http.post('/api/progress/complete', () => HttpResponse.error()),
    http.post('/api/progress/challenge/complete', () => HttpResponse.error()),
  )
}

function loginAs(user: User) {
  const auth = useAuthStore()
  auth.setSession('test-token', user)
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('progress store backend sync', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('does not sync when not authenticated', async () => {
    const { received } = useFakeBackend()
    const store = useProgressStore()
    const ok = await store.syncWithBackend()
    expect(ok).toBe(false)
    expect(received).toEqual([])
  })

  it('does not push completions to backend for guests', async () => {
    const { received } = useFakeBackend()
    const store = useProgressStore()
    store.completeModule('bind', 60)
    await Promise.resolve()
    expect(received).toEqual([])
    expect(store.pendingSyncCount).toBe(1)
  })

  it('merges remote progress into local on sync', async () => {
    useFakeBackend({
      xp: 50,
      level: 3,
      completedModules: ['curry', 'memoize'],
      completedChallenges: { curry: ['test-1'] },
    })
    loginAs(testUser)
    const store = useProgressStore()
    store.progress.completedModules.push('bind')

    const ok = await store.syncWithBackend()

    expect(ok).toBe(true)
    expect(store.isOnline).toBe(true)
    expect(store.completedModules).toEqual(expect.arrayContaining(['bind', 'curry', 'memoize']))
    expect(store.isChallengeCompleted('curry', 'test-1')).toBe(true)
    expect(store.level).toBe(3)
    expect(store.totalXp).toBe(50)
    expect(store.xpToNext).toBe(225) // xpForLevel(3)
  })

  it('does not regress local progress when local is ahead', async () => {
    useFakeBackend({ xp: 10, level: 1 })
    loginAs(testUser)
    const store = useProgressStore()
    store.addXp(120) // level 2, xp 20

    await store.syncWithBackend()

    expect(store.level).toBe(2)
    expect(store.totalXp).toBe(20)
  })

  it('pushes completions to backend when authenticated', async () => {
    const { state, received } = useFakeBackend()
    loginAs(testUser)
    const store = useProgressStore()

    store.completeModule('bind', 60)
    store.completeChallenge('bind', 'test-1', 20)
    await vi_waitForQueue(store)

    expect(received).toEqual(['bind', 'bind/test-1'])
    expect(state.completedModules).toContain('bind')
    expect(store.pendingSyncCount).toBe(0)
    expect(store.isOnline).toBe(true)
  })

  it('queues completions and goes offline when backend is unreachable', async () => {
    useOfflineBackend()
    loginAs(testUser)
    const store = useProgressStore()

    store.completeModule('bind', 60)
    await vi_waitForQueue(store, { expectDrained: false })

    // Local progress still works
    expect(store.isModuleCompleted('bind')).toBe(true)
    expect(store.totalXp).toBe(60)
    // But the change is queued and we are offline
    expect(store.isOnline).toBe(false)
    expect(store.pendingSyncCount).toBe(1)
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY)!)).toHaveLength(1)
  })

  it('flushes the queue on next successful sync', async () => {
    useOfflineBackend()
    loginAs(testUser)
    const store = useProgressStore()
    store.completeModule('bind', 60)
    store.completeModule('curry', 40)
    await vi_waitForQueue(store, { expectDrained: false })
    expect(store.isOnline).toBe(false)
    expect(store.pendingSyncCount).toBe(2)

    // Backend is reachable again
    server.resetHandlers()
    const { state, received } = useFakeBackend()

    const ok = await store.syncWithBackend()

    expect(ok).toBe(true)
    expect(store.isOnline).toBe(true)
    expect(store.pendingSyncCount).toBe(0)
    expect(received).toEqual(['bind', 'curry'])
    expect(state.completedModules).toEqual(['bind', 'curry'])
    expect(localStorage.getItem(QUEUE_KEY)).toBe('[]')
  })

  it('flushes guest completions after login', async () => {
    const { state } = useFakeBackend()
    const store = useProgressStore()

    // Completed as guest — stays local
    store.completeModule('bind', 60)
    await Promise.resolve()
    expect(store.pendingSyncCount).toBe(1)

    // Login and sync
    loginAs(testUser)
    const ok = await store.syncWithBackend()

    expect(ok).toBe(true)
    expect(store.pendingSyncCount).toBe(0)
    expect(state.completedModules).toContain('bind')
  })

  it('restores pending queue from localStorage on init', () => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([
      { type: 'module', moduleSlug: 'bind', xpReward: 60 },
    ]))
    const store = useProgressStore()
    expect(store.pendingSyncCount).toBe(1)
  })

  it('clears the pending queue on reset', async () => {
    useOfflineBackend()
    loginAs(testUser)
    const store = useProgressStore()
    store.completeModule('bind', 60)
    await vi_waitForQueue(store, { expectDrained: false })
    expect(store.pendingSyncCount).toBe(1)

    store.resetProgress()
    expect(store.pendingSyncCount).toBe(0)
  })
})

/**
 * completeModule/completeChallenge flush the queue in the background
 * (fire-and-forget). Poll until the flush settles instead of guessing
 * a fixed number of microtask ticks.
 */
async function vi_waitForQueue(
  store: ReturnType<typeof useProgressStore>,
  { expectDrained = true } = {},
) {
  for (let i = 0; i < 50; i++) {
    await new Promise(resolve => setTimeout(resolve, 10))
    if (expectDrained ? store.pendingSyncCount === 0 : !store.isOnline)
      return
  }
  throw new Error('queue did not settle in time')
}
