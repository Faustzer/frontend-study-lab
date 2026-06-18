export interface TopicItem {
  slug: string
  title: string
  description: string
  category: string
  order: number
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
  component: () => Promise<any>
  sourcePath: string
  tags: string[]
}

export interface TopicCategory {
  slug: string
  title: string
  description: string
  icon: string
  order: number
  items: TopicItem[]
}

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

/** @deprecated use TopicCategory instead */
export interface Topic {
  title: string
  href: string
  items?: Topic[]
}
