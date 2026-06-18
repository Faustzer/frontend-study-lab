import { createRouter, createWebHistory } from 'vue-router'
import { useTopics } from '@/composables/useTopics'
import HomePage from '@/pages/HomePage.vue'

const { routes } = useTopics()

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    ...routes.value,
  ],
})
