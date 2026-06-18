export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  provider: 'google' | 'twitch' | 'discord'
  createdAt: string
}

export interface UserProgress {
  xp: number
  level: number
  completedModules: string[]
  completedChallenges: Record<string, string[]>
}

export interface CompleteModuleRequest {
  moduleSlug: string
  xpReward: number
}

export interface CompleteChallengeRequest {
  moduleSlug: string
  challengeId: string
  xpReward: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  status: number
}
