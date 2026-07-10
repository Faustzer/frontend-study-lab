import i18n from '@/i18n'

// Manual vue-i18n setup, same as the old main.ts.
// Phase 2 of the migration replaces this with @nuxtjs/i18n.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(i18n)
})
