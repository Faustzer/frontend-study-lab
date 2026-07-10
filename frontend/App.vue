<template>
  <div class="shell">
    <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
    <AppHeader />
    <AppOverlay />
    <AppSidebar />

    <main id="main-content" class="content">
      <PageSkeleton v-if="ui.routeLoading" />
      <RouterView v-else v-slot="{ Component }">
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
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppOverlay from '@/components/layout/AppOverlay.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import PageSkeleton from '@/components/ui/PageSkeleton.vue'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
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
