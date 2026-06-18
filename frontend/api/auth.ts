import type { User } from './types'
import { api } from './client'

export const authApi = {
  getMe(): Promise<User> {
    return api.get<User>('/auth/me')
  },

  logout(): Promise<void> {
    return api.post<void>('/auth/logout', {})
  },

  getLoginUrl(provider: 'google' | 'twitch' | 'discord'): string {
    return `${api.baseUrl}/auth/${provider}`
  },
}
