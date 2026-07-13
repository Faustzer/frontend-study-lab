import { useProgressStore } from '../progress'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'frontend-study-lab-progress'

// Mock localStorage for tests
const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
})

const DAY = 24 * 60 * 60 * 1000
const BASE_DATE = new Date('2026-07-12T12:00:00')

describe('progress store — gamification', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(BASE_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('totalEarned', () => {
    it('accumulates all earned XP', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      store.completeModule('curry', 60)
      expect(store.totalEarned).toBe(120)
    })

    it('does not burn on level-up', () => {
      const store = useProgressStore()
      store.addXp(250) // два level-up подряд, xp в уровне обнуляется
      expect(store.totalXp).toBe(0)
      expect(store.totalEarned).toBe(250)
    })

    it('is estimated when migrating pre-redesign progress', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level: 3,
        xp: 50,
        xpToNextLevel: 225,
        completedModules: ['bind'],
        completedChallenges: {},
        lastActive: '2026-01-01T00:00:00.000Z',
      }))
      const store = useProgressStore()
      // потрачено на уровни: 100 + 150, плюс текущие 50
      expect(store.totalEarned).toBe(300)
      expect(store.streak).toBe(0)
      expect(store.questSlug).toBeNull()
    })
  })

  describe('streak', () => {
    it('starts at 1 on the first completion', () => {
      const store = useProgressStore()
      expect(store.streak).toBe(0)
      expect(store.completedToday).toBe(false)
      store.completeModule('bind', 60)
      expect(store.streak).toBe(1)
      expect(store.completedToday).toBe(true)
    })

    it('does not grow twice within one day', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      store.completeModule('curry', 60)
      expect(store.streak).toBe(1)
    })

    it('grows by 1 on the next consecutive day', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      vi.setSystemTime(new Date(BASE_DATE.getTime() + DAY))
      store.completeModule('curry', 60)
      expect(store.streak).toBe(2)
      expect(store.completedToday).toBe(true)
    })

    it('resets to 1 after a missed day', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      vi.setSystemTime(new Date(BASE_DATE.getTime() + 2 * DAY))
      store.completeModule('curry', 60)
      expect(store.streak).toBe(1)
    })
  })

  describe('daily quest', () => {
    const SLUGS = ['bind', 'curry', 'debounce']

    it('assigns a quest from not-yet-completed modules', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      store.ensureDailyQuest(SLUGS)
      expect(store.questSlug).not.toBeNull()
      expect(store.questSlug).not.toBe('bind')
      expect(SLUGS).toContain(store.questSlug)
    })

    it('keeps the same quest for the whole day', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(SLUGS)
      const first = store.questSlug
      store.ensureDailyQuest(SLUGS)
      expect(store.questSlug).toBe(first)
    })

    it('reassigns the quest on a new day', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(SLUGS)
      vi.setSystemTime(new Date(BASE_DATE.getTime() + DAY))
      // до повторного ensure квест «вчерашний» — не активен
      expect(store.isQuestActive(store.questSlug!)).toBe(false)
      store.ensureDailyQuest(SLUGS)
      expect(store.progress.questAssignedDate).toBe('2026-07-13')
    })

    it('doubles XP for the quest module', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(SLUGS)
      const quest = store.questSlug!
      expect(store.isQuestActive(quest)).toBe(true)
      expect(store.rewardFor(quest, 30)).toBe(60)

      const result = store.completeModule(quest, 30)
      expect(result?.reward).toBe(60)
      expect(result?.wasQuest).toBe(true)
      expect(store.totalXp).toBe(60)
      expect(store.questCompletedToday).toBe(true)
    })

    it('does not double XP for non-quest modules', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(SLUGS)
      const other = SLUGS.find(s => s !== store.questSlug)!
      expect(store.rewardFor(other, 60)).toBe(60)
      const result = store.completeModule(other, 60)
      expect(result?.reward).toBe(60)
      expect(result?.wasQuest).toBe(false)
      expect(store.questCompletedToday).toBe(false)
    })

    it('quest is no longer active once completed', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(SLUGS)
      const quest = store.questSlug!
      store.completeModule(quest, 30)
      expect(store.isQuestActive(quest)).toBe(false)
    })
  })

  describe('completeModule result', () => {
    it('reports a level-up', () => {
      const store = useProgressStore()
      const result = store.completeModule('bind', 120)
      expect(result).toMatchObject({ reward: 120, leveledUp: true, level: 2 })
    })

    it('returns undefined for an already completed module', () => {
      const store = useProgressStore()
      store.completeModule('bind', 60)
      expect(store.completeModule('bind', 60)).toBeUndefined()
    })
  })

  describe('resetProgress', () => {
    it('clears gamification state', () => {
      const store = useProgressStore()
      store.ensureDailyQuest(['bind', 'curry'])
      store.completeModule('bind', 60)
      store.resetProgress()
      expect(store.streak).toBe(0)
      expect(store.totalEarned).toBe(0)
      expect(store.questSlug).toBeNull()
      expect(store.completedToday).toBe(false)
    })
  })
})
