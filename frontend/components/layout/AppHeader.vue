<template>
  <header class="mobile-header">
    <img src="@/assets/images/logo.svg" alt="Fsl" height="36">
    <button
      class="burger"
      :class="{ open: ui.mobileSidebarOpen }"
      :aria-label="t('common.toggleMenu')"
      :aria-expanded="ui.mobileSidebarOpen"
      @click="ui.toggleMobileSidebar()"
    >
      <span />
      <span />
      <span />
    </button>
    <div class="mobile-brand">
      <span class="mobile-level">Lv.{{ level }}</span>
      <span class="brand-title">Frontend Study Lab</span>
    </div>
    <div class="mobile-xp">
      <UiProgressBar :value="xpPercent" size="sm" />
      <span class="xp-text">{{ xp }} {{ t('common.xp') }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'
import UiProgressBar from '@/components/ui/UiProgressBar.vue'

const { t } = useI18n()
const progress = useProgressStore()
const ui = useUiStore()

const level = computed(() => progress.level)
const xp = computed(() => progress.totalXp)
const xpPercent = computed(() => progress.xpPercent)
</script>
