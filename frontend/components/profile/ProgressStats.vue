<template>
  <div class="progress-stats">
    <div class="progress-stats__item">
      <span class="progress-stats__icon">⚡</span>
      <span class="progress-stats__value">{{ progress.level }}</span>
      <span class="progress-stats__label">{{ t('common.level') }}</span>
    </div>
    <div class="progress-stats__item">
      <span class="progress-stats__icon">✨</span>
      <span class="progress-stats__value">{{ progress.totalXp }}</span>
      <span class="progress-stats__label">{{ t('common.xp') }}</span>
    </div>
    <div class="progress-stats__item">
      <span class="progress-stats__icon">✅</span>
      <span class="progress-stats__value">{{ progress.completedCount }}</span>
      <span class="progress-stats__label">{{ t('profile.modulesCompleted') }}</span>
    </div>
    <div class="progress-stats__item">
      <span class="progress-stats__icon">🔥</span>
      <span class="progress-stats__value">{{ overallPercent }}%</span>
      <span class="progress-stats__label">{{ t('common.progress') }}</span>
    </div>
  </div>

  <div class="progress-stats__bar">
    <div class="progress-stats__bar-header">
      <span>{{ t('common.level') }} {{ progress.level }}</span>
      <span>{{ t('common.level') }} {{ progress.level + 1 }}</span>
    </div>
    <UiProgressBar :value="progress.xpPercent" />
    <span class="progress-stats__bar-hint">
      {{ progress.xpToNext }} {{ t('common.xpToLevelUp') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useTopics } from '@/composables/useTopics'
import UiProgressBar from '@/components/ui/UiProgressBar.vue'

const { t } = useI18n()
const progress = useProgressStore()
const { allModules } = useTopics()

const overallPercent = computed(() => {
  const total = allModules.value.length
  if (total === 0) {
    return 0
  }
  return Math.round((progress.completedCount / total) * 100)
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.progress-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-sm;

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.progress-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: $space-md;
  background: $color-bg-card;
  border-radius: $radius-md;
  border: 1px solid $color-border;
}

.progress-stats__icon {
  font-size: 20px;
}

.progress-stats__value {
  font-size: 20px;
  font-weight: 700;
  color: $color-text;
}

.progress-stats__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $color-text-muted;
}

.progress-stats__bar {
  display: flex;
  flex-direction: column;
  gap: $space-xs;
  padding: $space-md;
  background: $color-bg-card;
  border-radius: $radius-md;
  border: 1px solid $color-border;
}

.progress-stats__bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: $color-text-muted;
}

.progress-stats__bar-hint {
  font-size: 12px;
  color: $color-text-faint;
  text-align: center;
}
</style>
