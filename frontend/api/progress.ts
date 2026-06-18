import type { CompleteChallengeRequest, CompleteModuleRequest, UserProgress } from './types'
import { api } from './client'

export const progressApi = {
  get(): Promise<UserProgress> {
    return api.get<UserProgress>('/progress')
  },

  completeModule(data: CompleteModuleRequest): Promise<UserProgress> {
    return api.post<UserProgress>('/progress/complete', data)
  },

  completeChallenge(data: CompleteChallengeRequest): Promise<UserProgress> {
    return api.post<UserProgress>('/progress/challenge/complete', data)
  },
}
