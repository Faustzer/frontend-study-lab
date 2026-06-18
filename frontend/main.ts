import { createPinia } from 'pinia'
import { createApp } from 'vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import { router } from './router'
import i18n from './i18n'
import '@/assets/scss/index.scss'


async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const app = createApp(App)

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  app.use(pinia)
  app.use(router)
  app.use(i18n)

  app.mount('#app')
}

bootstrap()

bootstrap()
