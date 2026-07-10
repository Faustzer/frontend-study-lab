<template>
  <section class="home">
    <!-- Hero -->
    <div class="home__hero">
      <p class="home__badge">
        {{ $t('common.practiceFirst') }}
      </p>
      <h2 class="home__title">
        Frontend Study Lab
      </h2>
      <p class="home__lead">
        {{ $t('common.tagline') }}
      </p>
    </div>

    <!-- Stats row -->
    <div class="home__stats">
      <div class="home__stat">
        <span class="home__stat-icon">⚡</span>
        <div class="home__stat-info">
          <span class="home__stat-value">{{ level }}</span>
          <span class="home__stat-label">{{ $t('common.level') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon">✨</span>
        <div class="home__stat-info">
          <span class="home__stat-value">{{ xp }}</span>
          <span class="home__stat-label">{{ $t('common.xp') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon">✅</span>
        <div class="home__stat-info">
          <span class="home__stat-value">{{ completedCount }}/{{ totalModules }}</span>
          <span class="home__stat-label">{{ $t('common.modules') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon">🔥</span>
        <div class="home__stat-info">
          <span class="home__stat-value">{{ overallPercent }}%</span>
          <span class="home__stat-label">{{ $t('common.progress') }}</span>
        </div>
      </div>
    </div>

    <!-- XP Progress bar -->
    <div class="home__level">
      <div class="home__level-header">
        <span>{{ $t('common.level') }} {{ level }}</span>
        <span>{{ $t('common.level') }} {{ level + 1 }}</span>
      </div>
      <div class="home__progress-bar">
        <div class="home__progress-fill" :style="{ width: `${xpPercent}%` }" />
      </div>
      <p class="home__progress-hint">
        {{ xpToNext }} {{ $t('common.xpToLevelUp') }}
      </p>
    </div>

    <!-- Categories grid -->
    <h3 class="home__section-title">
      {{ $t('common.categories') }}
    </h3>
    <div class="home__categories">
      <RouterLink
        v-for="cat in categories" :key="cat.slug"
        :to="cat.items.length ? `/${cat.slug}/${cat.items[0].slug}` : '/'" class="home__category"
      >
        <span class="home__category-icon">{{ cat.icon }}</span>
        <h4 class="home__category-title">
          {{ $t(`categories.${cat.slug}.title`) }}
        </h4>
        <p class="home__category-desc">
          {{ $t(`categories.${cat.slug}.description`) }}
        </p>
        <div class="home__category-meta">
          <span>{{ cat.items.length }} {{ $t('common.modules') }}</span>
          <span v-if="getCategoryProgress(cat) > 0" class="home__category-progress-text">
            {{ getCategoryProgress(cat) }}% done
          </span>
        </div>
        <div class="home__category-progress-bar">
          <div class="home__category-progress-fill" :style="{ width: `${getCategoryProgress(cat)}%` }" />
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TopicCategory } from '@/types/topic'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

const { categories, allModules } = useTopics()
const progress = useProgressStore()

const level = computed(() => progress.level)
const xp = computed(() => progress.totalXp)
const xpPercent = computed(() => progress.xpPercent)
const xpToNext = computed(() => progress.xpToNext)
const completedCount = computed(() => progress.completedCount)
const totalModules = computed(() => allModules.value.length)
const overallPercent = computed(() => {
  if (!totalModules.value)
    return 0
  return Math.round((completedCount.value / totalModules.value) * 100)
})

function getCategoryProgress(cat: TopicCategory): number {
  if (!cat.items.length)
    return 0
  const done = cat.items.filter(item => progress.isModuleCompleted(item.slug)).length
  return Math.round((done / cat.items.length) * 100)
}
</script>

<style lang="scss">
@use '@/assets/scss/pages/home' as *;
</style>
