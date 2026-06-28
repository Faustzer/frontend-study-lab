import { createRouter, createWebHistory } from 'vue-router'
import { useTopics } from '@/composables/useTopics'
import { useAuthGuard } from '@/composables/useAuthGuard'
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
