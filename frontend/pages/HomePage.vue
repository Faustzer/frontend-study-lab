<template>
  <section class="dashboard">
    <!-- Hero -->
    <div class="hero">
      <p class="badge">
        {{ $t('common.practiceFirst') }}
      </p>
      <h2>Frontend Study Lab</h2>
      <p class="lead">
        {{ $t('common.tagline') }}
      </p>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-icon">⚡</span>
        <div class="stat-info">
          <span class="stat-value">{{ level }}</span>
          <span class="stat-label">{{ $t('common.level') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✨</span>
        <div class="stat-info">
          <span class="stat-value">{{ xp }}</span>
          <span class="stat-label">{{ $t('common.xp') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <div class="stat-info">
          <span class="stat-value">{{ completedCount }}/{{ totalModules }}</span>
          <span class="stat-label">{{ $t('common.modules') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔥</span>
        <div class="stat-info">
          <span class="stat-value">{{ overallPercent }}%</span>
          <span class="stat-label">{{ $t('common.progress') }}</span>
        </div>
      </div>
    </div>

    <!-- XP Progress bar -->
    <div class="level-card">
      <div class="level-header">
        <span>{{ $t('common.level') }} {{ level }}</span>
        <span>{{ $t('common.level') }} {{ level + 1 }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${xpPercent}%` }" />
      </div>
      <p class="progress-hint">
        {{ xpToNext }} {{ $t('common.xpToLevelUp') }}
      </p>
    </div>

    <!-- Categories grid -->
    <h3 class="section-title">
      {{ $t('common.categories') }}
    </h3>
    <div class="categories-grid">
      <RouterLink
        v-for="cat in categories" :key="cat.slug"
        :to="cat.items.length ? `/${cat.slug}/${cat.items[0].slug}` : '/'" class="category-card"
      >
        <span class="cat-icon">{{ cat.icon }}</span>
        <h4>{{ $t(`categories.${cat.slug}.title`) }}</h4>
        <p>{{ $t(`categories.${cat.slug}.description`) }}</p>
        <div class="cat-meta">
          <span>{{ cat.items.length }} {{ $t('common.modules') }}</span>
          <span v-if="getCategoryProgress(cat) > 0" class="cat-progress">
            {{ getCategoryProgress(cat) }}% done
          </span>
        </div>
        <div class="cat-progress-bar">
          <div class="cat-progress-fill" :style="{ width: `${getCategoryProgress(cat)}%` }" />
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
