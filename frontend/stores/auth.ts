import type { User } from '@/api/types'
import { authApi } from '@/api/auth'
import { api } from '@/api/client'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const TOKEN_KEY = 'frontend-study-lab-token'
const USER_KEY = 'frontend-study-lab-user'
const STATE_KEY = 'frontend-study-lab-oauth-state'

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

/**
 * Generate a random OAuth state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(loadToken())
  const user = ref<User | null>(loadUser())

  // Sync token with API client on init
  if (token.value) {
    api.setToken(token.value)
  }

  // Persist to localStorage on change
  watch(token, (val) => {
    if (val) {
      localStorage.setItem(TOKEN_KEY, val)
      api.setToken(val)
    }
    else {
      localStorage.removeItem(TOKEN_KEY)
      api.setToken(null)
    }
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
   * Redirect to backend OAuth login endpoint.
   * Generates and stores a random `state` parameter for CSRF protection.
   * The backend must return this same state in the callback.
   */
  function login(provider: 'google' | 'twitch' | 'discord') {
    const state = generateState()
    try {
      localStorage.setItem(STATE_KEY, state)
    }
    catch { /* ignore */ }

    const loginUrl = authApi.getLoginUrl(provider)
    const separator = loginUrl.includes('?') ? '&' : '?'
    window.location.href = `${loginUrl}${separator}state=${state}`
  }

  /**
   * Handle OAuth callback — extract token and user from URL params,
   * verify state for CSRF protection, then persist session.
   * Returns true on success, false on failure.
   */
  function handleCallback(params: URLSearchParams): boolean {
    // Verify state to prevent CSRF attacks
    const returnedState = params.get('state')
    const savedState = localStorage.getItem(STATE_KEY)
    localStorage.removeItem(STATE_KEY)

    if (!returnedState || returnedState !== savedState) {
      clearSession()
      return false
    }

    const newToken = params.get('token')
    const userRaw = params.get('user')

    if (!newToken || !userRaw) {
      clearSession()
      return false
    }

    try {
      const newUser: User = JSON.parse(decodeURIComponent(userRaw))
      setSession(newToken, newUser)
      return true
    }
    catch {
      clearSession()
      return false
    }
  }

  /**
   * Set token and user after successful OAuth callback
   */
  function setSession(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
  }

  /**
   * Fetch current user profile from backend via API client.
   * Clears session on failure (e.g. expired/invalid token).
   */
  async function fetchProfile(): Promise<User | null> {
    try {
      const userData = await authApi.getMe()
      user.value = userData
      return userData
    }
    catch {
      clearSession()
      return null
    }
  }

  /**
   * Logout — call backend to invalidate session, then clear local state.
   * Falls back to local-only logout if the API call fails.
   */
  async function logout() {
    try {
      await authApi.logout()
    }
    catch { /* backend unavailable — still clear locally */ }
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
    localStorage.removeItem(STATE_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    userDisplayName,
    userAvatar,
    userProvider,
    login,
    handleCallback,
    setSession,
    fetchProfile,
    logout,
    clearSession,
  }
})
