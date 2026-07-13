<template>
  <div class="shell">
    <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
    <AppHeader />
    <AppOverlay />
    <AppSidebar />

    <main id="main-content" class="content">
      <PageSkeleton v-if="ui.routeLoading" />
      <slot v-else />
      <AppFooter />
    </main>

    <AuthModal />
    <ToastContainer />
    <ConfettiBurst />
    <LevelUpModal />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppOverlay from '@/components/layout/AppOverlay.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import ConfettiBurst from '@/components/celebration/ConfettiBurst.vue'
import LevelUpModal from '@/components/celebration/LevelUpModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import PageSkeleton from '@/components/ui/PageSkeleton.vue'
import { watchEffect } from 'vue'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const ui = useUiStore()

// Назначаем «задание дня» из списка модулей (детерминированно по дате)
const { allModules } = useTopics()
const progress = useProgressStore()
watchEffect(() => {
  progress.ensureDailyQuest(allModules.value.map(m => m.slug))
})
</script>
