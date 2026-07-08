<template>
  <div class="shell">
    <AppHeader />
    <AppOverlay />
    <AppSidebar />

    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
      <AppFooter />
    </main>

    <AuthModal />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppOverlay from '@/components/layout/AppOverlay.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const progress = useProgressStore()
const ui = useUiStore()

// Register 401 handler — clear session and show auth modal
api.setOnUnauthorized(() => {
  auth.clearSession()
  ui.openAuthModal()
})

// Sync dark mode class on <html>
watchEffect(() => {
  document.documentElement.classList.toggle('dark', ui.theme === 'dark')
})

onMounted(() => {
  if (auth.isAuthenticated) {
    void progress.syncWithBackend()
  } else if (ui.shouldShowAuthModal()) {
    ui.openAuthModal()
  }
})
</script>

<style lang="scss">
@use '@/assets/scss/pages/app' as *;
</style>
