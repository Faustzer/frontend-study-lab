import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

/**
 * Route meta flag to mark pages that require authentication.
 *
 * Usage in route definition:
 * ```ts
 * { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } }
 * ```
 */
declare module 'vue-router' {
  // eslint-disable-next-line unused-imports/no-unused-vars -- module augmentation, the name must match vue-router's
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

/**
 * Composable that provides navigation guards for auth-protected routes.
 *
 * - If `meta.requiresAuth` is true and user is not authenticated,
 *   the auth modal is opened and navigation is prevented.
 * - If user is authenticated, navigation proceeds normally.
 */
export function useAuthGuard() {
  const auth = useAuthStore()
  const ui = useUiStore()

  /**
   * Navigation guard — call from `router.beforeEach()`.
   *
   * @param to   — target route
   * @param _from — current route
   * @param next — continue/abort callback
   */
  function guard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) {
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      ui.openAuthModal()
      next(false)
      return
    }

    next()
  }

  return { guard }
}
