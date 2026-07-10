import type { UserProgress as RemoteProgress } from '@/api/types'
import type { UserProgress } from '@/types/progress'
import { progressApi } from '@/api/progress'
import { useAuthStore } from '@/stores/auth'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'frontend-study-lab-progress'
const QUEUE_KEY = 'frontend-study-lab-progress-queue'

/**
 * A completion that has not been confirmed by the backend yet.
 * Every completion (including ones made as a guest) is enqueued;
 * the queue is flushed once the user is authenticated and online.
 */
type PendingCompletion
  = | { type: 'module', moduleSlug: string, xpReward: number }
    | { type: 'challenge', moduleSlug: string, challengeId: string, xpReward: number }

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return JSON.parse(raw)
  } catch { /* ignore */ }
  return defaultProgress()
}

function loadQueue(): PendingCompletion[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (raw)
      return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function defaultProgress(): UserProgress {
  return {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    completedModules: [],
    completedChallenges: {},
    lastActive: new Date().toISOString(),
  }
}

/** XP required to reach level N */
function xpForLevel(level: number): number {
  return Math.floor(100 * 1.5 ** (level - 1))
}

export const useProgressStore = defineStore('progress', () => {
  const auth = useAuthStore()

  const progress = ref<UserProgress>(loadProgress())
  const pendingQueue = ref<PendingCompletion[]>(loadQueue())

  /**
   * False after the last backend call failed. Local progress keeps
   * working offline; completions stay in `pendingQueue` until the
   * next successful `syncWithBackend()`.
   */
  const isOnline = ref(true)

  // Persist to localStorage on every change
  watch(progress, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  watch(pendingQueue, (val) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(val))
  }, { deep: true })

  // Retry sync when the browser regains connectivity
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      void syncWithBackend()
    })
  }

  const totalXp = computed(() => progress.value.xp)
  const level = computed(() => progress.value.level)
  const xpToNext = computed(() => progress.value.xpToNextLevel)
  const xpPercent = computed(() => {
    const current = progress.value.xp
    const needed = progress.value.xpToNextLevel
    return Math.min(100, Math.floor((current / needed) * 100))
  })

  const completedCount = computed(() => progress.value.completedModules.length)
  const completedModules = computed(() => progress.value.completedModules)
  const pendingSyncCount = computed(() => pendingQueue.value.length)

  function isModuleCompleted(slug: string): boolean {
    return progress.value.completedModules.includes(slug)
  }

  function isChallengeCompleted(moduleSlug: string, challengeId: string): boolean {
    return progress.value.completedChallenges[moduleSlug]?.includes(challengeId) ?? false
  }

  function completeModule(slug: string, xpReward: number) {
    if (progress.value.completedModules.includes(slug))
      return
    progress.value.completedModules.push(slug)
    addXp(xpReward)
    pendingQueue.value.push({ type: 'module', moduleSlug: slug, xpReward })
    void flushQueue()
  }

  function completeChallenge(moduleSlug: string, challengeId: string, xpReward: number) {
    if (!progress.value.completedChallenges[moduleSlug]) {
      progress.value.completedChallenges[moduleSlug] = []
    }
    if (progress.value.completedChallenges[moduleSlug].includes(challengeId))
      return
    progress.value.completedChallenges[moduleSlug].push(challengeId)
    addXp(xpReward)
    pendingQueue.value.push({ type: 'challenge', moduleSlug, challengeId, xpReward })
    void flushQueue()
  }

  function addXp(amount: number) {
    progress.value.xp += amount

    // Check for level-up
    while (progress.value.xp >= progress.value.xpToNextLevel) {
      progress.value.xp -= progress.value.xpToNextLevel
      progress.value.level += 1
      progress.value.xpToNextLevel = xpForLevel(progress.value.level)
    }

    progress.value.lastActive = new Date().toISOString()
  }

  /**
   * Push queued completions to the backend, oldest first.
   * Silently does nothing for guests. On the first failure the
   * remaining entries stay queued and `isOnline` flips to false.
   * Concurrent calls share one in-flight flush so entries are
   * never sent twice.
   */
  let activeFlush: Promise<boolean> | null = null

  function flushQueue(): Promise<boolean> {
    if (!activeFlush) {
      activeFlush = doFlush().finally(() => {
        activeFlush = null
      })
    }
    return activeFlush
  }

  async function doFlush(): Promise<boolean> {
    if (!auth.isAuthenticated)
      return false

    while (pendingQueue.value.length > 0) {
      const entry = pendingQueue.value[0]
      try {
        if (entry.type === 'module') {
          await progressApi.completeModule({ moduleSlug: entry.moduleSlug, xpReward: entry.xpReward })
        } else {
          await progressApi.completeChallenge({
            moduleSlug: entry.moduleSlug,
            challengeId: entry.challengeId,
            xpReward: entry.xpReward,
          })
        }
        pendingQueue.value.shift()
      } catch {
        isOnline.value = false
        return false
      }
    }

    isOnline.value = true
    return true
  }

  /**
   * Full sync with the backend: flush pending local completions,
   * then fetch the server state and merge it into local progress.
   * Call after login and whenever connectivity is restored.
   * Returns true on success; flips `isOnline` accordingly.
   */
  async function syncWithBackend(): Promise<boolean> {
    if (!auth.isAuthenticated)
      return false

    if (!await flushQueue())
      return false

    try {
      const remote = await progressApi.get()
      mergeRemoteProgress(remote)
      isOnline.value = true
      return true
    } catch {
      isOnline.value = false
      return false
    }
  }

  /**
   * Merge server progress into local state: completed sets are
   * unioned, and level/XP are only adopted when the server is
   * further ahead, so local progress never regresses.
   */
  function mergeRemoteProgress(remote: RemoteProgress) {
    for (const slug of remote.completedModules) {
      if (!progress.value.completedModules.includes(slug))
        progress.value.completedModules.push(slug)
    }

    for (const [moduleSlug, ids] of Object.entries(remote.completedChallenges)) {
      if (!progress.value.completedChallenges[moduleSlug]) {
        progress.value.completedChallenges[moduleSlug] = []
      }
      for (const id of ids) {
        if (!progress.value.completedChallenges[moduleSlug].includes(id))
          progress.value.completedChallenges[moduleSlug].push(id)
      }
    }

    const local = progress.value
    if (remote.level > local.level || (remote.level === local.level && remote.xp > local.xp)) {
      local.level = remote.level
      local.xp = remote.xp
      local.xpToNextLevel = xpForLevel(remote.level)
    }
  }

  function resetProgress() {
    Object.assign(progress.value, defaultProgress())
    pendingQueue.value = []
  }

  return {
    progress,
    totalXp,
    level,
    xpToNext,
    xpPercent,
    completedCount,
    completedModules,
    isOnline,
    pendingSyncCount,
    isModuleCompleted,
    isChallengeCompleted,
    completeModule,
    completeChallenge,
    addXp,
    syncWithBackend,
    resetProgress,
  }
})
