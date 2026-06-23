import type { UserProgress } from '@/types/topic'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'frontend-study-lab-progress'

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return JSON.parse(raw)
  }
  catch { /* ignore */ }
  return defaultProgress()
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

/** Сколько XP нужно для уровня N */
function xpForLevel(level: number): number {
  return Math.floor(100 * 1.5 ** (level - 1))
}

export const useProgressStore = defineStore('progress', () => {
  const progress = ref<UserProgress>(loadProgress())

  // Сохраняем в localStorage при каждом изменении
  watch(progress, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

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
  }

  function completeChallenge(moduleSlug: string, challengeId: string, xpReward: number) {
    if (!progress.value.completedChallenges[moduleSlug]) {
      progress.value.completedChallenges[moduleSlug] = []
    }
    if (progress.value.completedChallenges[moduleSlug].includes(challengeId))
      return
    progress.value.completedChallenges[moduleSlug].push(challengeId)
    addXp(xpReward)
  }

  function addXp(amount: number) {
    progress.value.xp += amount

    // Проверяем повышение уровня
    while (progress.value.xp >= progress.value.xpToNextLevel) {
      progress.value.xp -= progress.value.xpToNextLevel
      progress.value.level += 1
      progress.value.xpToNextLevel = xpForLevel(progress.value.level)
    }

    progress.value.lastActive = new Date().toISOString()
  }

  function resetProgress() {
    Object.assign(progress.value, defaultProgress())
  }

  return {
    progress,
    totalXp,
    level,
    xpToNext,
    xpPercent,
    completedCount,
    completedModules,
    isModuleCompleted,
    isChallengeCompleted,
    completeModule,
    completeChallenge,
    addXp,
    resetProgress,
  }
})
