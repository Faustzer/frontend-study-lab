import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

/**
 * Pages opt in with `definePageMeta({ requiresAuth: true })`.
 * If the user is not authenticated, the auth modal is opened
 * and navigation is aborted — same behavior as the old
 * `useAuthGuard` composable in the Vite SPA.
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const ui = useUiStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    ui.openAuthModal()
    return abortNavigation()
  }
})
