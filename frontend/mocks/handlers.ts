import type { User, UserProgress } from '@/api/types'
import { delay, http, HttpResponse } from 'msw'

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
  provider: 'google',
  createdAt: new Date().toISOString(),
}

const mockProgress: UserProgress = {
  xp: 0,
  level: 1,
  completedModules: [],
  completedChallenges: {},
}

export const handlers = [
  // GET /api/auth/me
  http.get('/api/auth/me', async () => {
    await delay(100)
    return HttpResponse.json({ data: mockUser })
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(100)
    return HttpResponse.json({ data: null })
  }),

  // GET /api/progress
  http.get('/api/progress', async () => {
    await delay(100)
    return HttpResponse.json({ data: mockProgress })
  }),

  // POST /api/progress/complete
  http.post('/api/progress/complete', async ({ request }) => {
    await delay(100)
    const body = await request.json() as { moduleSlug: string, xpReward: number }
    mockProgress.xp += body.xpReward
    if (!mockProgress.completedModules.includes(body.moduleSlug)) {
      mockProgress.completedModules.push(body.moduleSlug)
    }
    return HttpResponse.json({ data: mockProgress })
  }),

  // POST /api/progress/challenge/complete
  http.post('/api/progress/challenge/complete', async ({ request }) => {
    await delay(100)
    const body = await request.json() as { moduleSlug: string, challengeId: string, xpReward: number }
    mockProgress.xp += body.xpReward
    if (!mockProgress.completedChallenges[body.moduleSlug]) {
      mockProgress.completedChallenges[body.moduleSlug] = []
    }
    mockProgress.completedChallenges[body.moduleSlug].push(body.challengeId)
    return HttpResponse.json({ data: mockProgress })
  }),
]
