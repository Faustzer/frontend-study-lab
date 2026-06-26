<template>
  <div class="shell">
    <AppHeader />
    <AppOverlay />
    <AppSidebar />

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppOverlay from '@/components/layout/AppOverlay.vue'
</script>

<style lang="scss">
@use '@/assets/scss/pages/app' as *;
</style>
