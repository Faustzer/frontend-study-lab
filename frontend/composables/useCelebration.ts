import type { CompletionResult } from '@/types/progress'
import { features } from '@/config/features'
import { reactive } from 'vue'

export interface ConfettiParticle {
  id: number
  x: number
  y: number
  dx: string
  dy: string
  up: string
  rot: string
  width: number
  height: number
  radius: string
  color: string
  duration: number
}

export interface ConfettiBurst {
  id: number
  parts: ConfettiParticle[]
}

export interface XpFloat {
  id: number
  label: string
}

interface CelebrationState {
  bursts: ConfettiBurst[]
  floats: XpFloat[]
  levelUp: { level: number, xpToNext: number } | null
}

const CONFETTI_COLORS = ['var(--accent)', '#e0a318', '#4a9d55', '#e8d9b8', '#2b2a22']
const PARTICLE_COUNT = 36

// Глобальное состояние: празднования рендерятся в layout и сайдбаре,
// а запускаются со страницы модуля
const state = reactive<CelebrationState>({
  bursts: [],
  floats: [],
  levelUp: null,
})

let uid = 0

/** Конфетти из центра элемента (обычно — кнопки завершения) */
function burstFrom(el: HTMLElement | null) {
  if (!features.celebrations)
    return
  const rect = el?.getBoundingClientRect()
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

  const id = ++uid
  const parts: ConfettiParticle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: cx,
    y: cy,
    dx: `${(Math.random() - 0.5) * 380}px`,
    dy: `${90 + Math.random() * 220}px`,
    up: `${-(40 + Math.random() * 140)}px`,
    rot: `${(Math.random() - 0.5) * 720}deg`,
    width: 6 + Math.random() * 5,
    height: 8 + Math.random() * 6,
    radius: Math.random() > 0.5 ? '999px' : '2px',
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 800 + Math.random() * 500,
  }))
  state.bursts.push({ id, parts })
  setTimeout(() => {
    state.bursts = state.bursts.filter(b => b.id !== id)
  }, 1500)
}

/** «+N XP» всплывает над XP-баром сайдбара */
function floatXp(amount: number) {
  if (!features.celebrations)
    return
  const id = ++uid
  state.floats.push({ id, label: `+${amount} XP` })
  setTimeout(() => {
    state.floats = state.floats.filter(f => f.id !== id)
  }, 1500)
}

function showLevelUp(level: number, xpToNext: number) {
  state.levelUp = { level, xpToNext }
}

function closeLevelUp() {
  state.levelUp = null
}

/**
 * Полный сценарий завершения модуля: конфетти из кнопки, «+N XP»
 * в сайдбаре и — при переходе уровня — Level-Up модалка с задержкой
 * 750 мс (после заполнения XP-бара).
 */
function celebrateCompletion(result: CompletionResult, xpToNext: number, button?: HTMLElement | null) {
  if (!features.celebrations)
    return
  burstFrom(button ?? null)
  floatXp(result.reward)
  if (result.leveledUp) {
    setTimeout(showLevelUp, 750, result.level, xpToNext)
  }
}

export function useCelebration() {
  return {
    state,
    burstFrom,
    floatXp,
    showLevelUp,
    closeLevelUp,
    celebrateCompletion,
  }
}
