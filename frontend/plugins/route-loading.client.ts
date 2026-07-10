import { useUiStore } from '@/stores/ui'

// Route-loading skeleton: only show after a short delay so fast
// navigations (cached chunks) don't flicker. Ported from router.ts.
export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router as import('vue-router').Router
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
})
