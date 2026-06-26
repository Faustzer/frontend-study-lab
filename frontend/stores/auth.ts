import type { User } from '@/api/types'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const TOKEN_KEY = 'frontend-study-lab-token'
const USER_KEY = 'frontend-study-lab-user'

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  }
  catch { /* ignore */ }
  return null
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw)
      return JSON.parse(raw)
  }
  catch { /* ignore */ }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(loadToken())
  const user = ref<User | null>(loadUser())

  // Persist to localStorage on change
  watch(token, (val) => {
    if (val)
      localStorage.setItem(TOKEN_KEY, val)
    else
      localStorage.removeItem(TOKEN_KEY)
  })

  watch(user, (val) => {
    if (val)
      localStorage.setItem(USER_KEY, JSON.stringify(val))
    else
      localStorage.removeItem(USER_KEY)
  })

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userDisplayName = computed(() => user.value?.displayName ?? '')
  const userAvatar = computed(() => user.value?.avatarUrl ?? '')
  const userProvider = computed(() => user.value?.provider ?? null)

  /**
   * Redirect to backend OAuth login endpoint
   */
  function login(provider: 'google' | 'twitch' | 'discord') {
    const apiBase = import.meta.env.VITE_API_URL || '/api'
    window.location.href = `${apiBase}/auth/${provider}`
  }

  /**
   * Set token and user after successful OAuth callback
   */
  function setSession(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
  }

  /**
   * Fetch current user profile from backend
   */
  async function fetchProfile() {
    const apiBase = import.meta.env.VITE_API_URL || '/api'
    const response = await fetch(`${apiBase}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      clearSession()
      return null
    }

    const userData: User = await response.json()
    user.value = userData
    return userData
  }

  /**
   * Logout — clear token and user
   */
  function logout() {
    clearSession()
  }

  /**
   * Clear session data
   */
  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    userDisplayName,
    userAvatar,
    userProvider,
    login,
    setSession,
    fetchProfile,
    logout,
    clearSession,
  }
})
