import AuthCallback from '@/pages/auth/callback.vue'
import { useAuthStore } from '@/stores/auth'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const STATE_KEY = 'frontend-study-lab-oauth-state'
const user = {
  id: 'u1',
  email: 'a@b.c',
  displayName: 'Alice',
  avatarUrl: '',
  provider: 'google',
  createdAt: '2026-01-01T00:00:00Z',
}

function mountAt(url: string) {
  window.history.replaceState(null, '', url)
  return mount(AuthCallback, {
    global: { plugins: [createI18n({ legacy: false, locale: 'en', missingWarn: false })] },
  })
}

function callbackParams(state: string) {
  return new URLSearchParams({ token: 'jwt-token', user: JSON.stringify(user), state }).toString()
}

describe('auth callback page', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    localStorage.setItem(STATE_KEY, 'csrf-1')
  })

  it('reads the session from the URL fragment', async () => {
    mountAt(`/auth/callback#${callbackParams('csrf-1')}`)
    await flushPromises()
    expect(useAuthStore().isAuthenticated).toBe(true)
  })

  it('still accepts query params from an older backend', async () => {
    mountAt(`/auth/callback?${callbackParams('csrf-1')}`)
    await flushPromises()
    expect(useAuthStore().isAuthenticated).toBe(true)
  })

  it('removes the token from the address bar', async () => {
    mountAt(`/auth/callback#${callbackParams('csrf-1')}`)
    await flushPromises()
    expect(window.location.href).not.toContain('jwt-token')
    expect(window.location.pathname).toBe('/auth/callback')
  })

  it('rejects a mismatched state', async () => {
    mountAt(`/auth/callback#${callbackParams('forged')}`)
    await flushPromises()
    expect(useAuthStore().isAuthenticated).toBe(false)
  })
})
