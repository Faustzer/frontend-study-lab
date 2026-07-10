<template>
  <NuxtLayout>
    <!-- Key by path so navigating between two topics remounts the page,
         matching the old :key="$route.path" behavior -->
    <NuxtPage :page-key="route => route.path" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
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
