export interface UserProgress {
  level: number
  xp: number
  xpToNextLevel: number
  completedModules: string[]
  completedChallenges: Record<string, string[]>
  lastActive: string
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
