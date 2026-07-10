import { createRouter, createWebHistory } from 'vue-router'
import { useTopics } from '@/composables/useTopics'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useUiStore } from '@/stores/ui'
import HomePage from '@/pages/HomePage.vue'
import AuthCallback from '@/pages/AuthCallback.vue'
import ProfilePage from '@/pages/ProfilePage.vue'

const { routes } = useTopics()

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    ...routes.value,
  ],
})

router.beforeEach((to, from, next) => {
  // Import lazily so Pinia is already active when the guard runs
  const { guard } = useAuthGuard()
  guard(to, from, next)
})

// Route-loading skeleton: only show after a short delay so fast
// navigations (cached chunks) don't flicker
let loadingTimer: ReturnType<typeof setTimeout> | undefined

router.beforeEach(() => {
  clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => {
    useUiStore().setRouteLoading(true)
  }, 150)
})

router.afterEach(() => {
  clearTimeout(loadingTimer)
  useUiStore().setRouteLoading(false)
})

router.onError(() => {
  clearTimeout(loadingTimer)
  useUiStore().setRouteLoading(false)
})
