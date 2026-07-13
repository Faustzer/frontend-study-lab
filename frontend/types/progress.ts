export interface UserProgress {
  level: number
  xp: number
  xpToNextLevel: number
  completedModules: string[]
  completedChallenges: Record<string, string[]>
  lastActive: string
  /** Суммарный заработанный XP (не сгорает при level-up) */
  totalEarned: number
  /** Дней подряд с завершениями */
  streak: number
  /** Локальная дата (YYYY-MM-DD) последнего завершения — для стрика */
  lastCompletedDate: string | null
  /** Слаг модуля «задания дня» */
  questSlug: string | null
  /** Локальная дата, когда квест был назначен */
  questAssignedDate: string | null
  /** Локальная дата, когда квест был выполнен */
  questCompletedDate: string | null
}

/** Итог завершения модуля — для празднований в UI */
export interface CompletionResult {
  /** Начислено XP (с учётом ×2 задания дня) */
  reward: number
  /** Был ли переход уровня */
  leveledUp: boolean
  /** Уровень после начисления */
  level: number
  /** Модуль был заданием дня */
  wasQuest: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  starterCode: string
  solution: string
  tests: string[]
  xpReward: number
}
