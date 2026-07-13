<template>
  <section class="home">
    <!-- Hero -->
    <div class="home__hero">
      <span class="home__float home__float--braces" aria-hidden="true">{ }</span>
      <span class="home__float home__float--arrow" aria-hidden="true">=&gt;</span>
      <span class="home__float home__float--parens" aria-hidden="true">( )</span>
      <span class="home__float home__float--slashes" aria-hidden="true">//</span>
      <p class="home__badge">
        ⚡ {{ t('common.practiceFirst') }}
      </p>
      <h1 class="home__title">
        Frontend Study Lab
      </h1>
      <p class="home__lead">
        {{ t('common.tagline') }}
      </p>
      <div class="home__cta">
        <UiButton variant="tactile" @click="continueLearning">
          ▶ {{ t('common.continueWith', { module: nextModuleTitle }) }}
        </UiButton>
        <span class="home__cta-hint">{{ t('home.ctaHint', { xp: nextReward }) }}</span>
      </div>
    </div>

    <DailyQuestBanner />

    <!-- Stats row -->
    <div class="home__stats">
      <div class="home__stat">
        <span class="home__stat-icon home__stat-icon--level">⚡</span>
        <div class="home__stat-info">
          <strong class="home__stat-value">{{ eased(level) }}</strong>
          <span class="home__stat-label">{{ t('common.level') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon home__stat-icon--xp">✨</span>
        <div class="home__stat-info">
          <strong class="home__stat-value">{{ eased(totalEarned) }}</strong>
          <span class="home__stat-label">{{ t('home.statXpTotal') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon home__stat-icon--done">✅</span>
        <div class="home__stat-info">
          <strong class="home__stat-value">{{ eased(completedCount) }}/{{ totalModules }}</strong>
          <span class="home__stat-label">{{ t('home.statModules') }}</span>
        </div>
      </div>
      <div class="home__stat">
        <span class="home__stat-icon home__stat-icon--streak">🔥</span>
        <div class="home__stat-info">
          <strong class="home__stat-value">{{ eased(streak) }}</strong>
          <span class="home__stat-label">{{ t('home.statStreak') }}</span>
        </div>
      </div>
    </div>

    <!-- Level + week streak -->
    <section class="home__level">
      <div class="home__level-progress">
        <div class="home__level-header">
          <span>{{ t('common.level') }} {{ level }}</span>
          <span class="home__level-next">{{ t('common.level') }} {{ level + 1 }}</span>
        </div>
        <div class="home__level-bar">
          <div class="home__level-fill" :style="{ width: `${xpPercent * ease}%` }" />
        </div>
        <p class="home__level-hint">
          {{ xpLeft }} {{ t('common.xpToLevelUp') }}
        </p>
      </div>
      <div class="home__streak">
        <span class="home__streak-title">{{ t('streak.week') }}</span>
        <div class="home__streak-days">
          <div v-for="day in weekDots" :key="day.label" class="home__day">
            <span
              class="home__day-dot"
              :class="{
                'home__day-dot--lit': day.lit,
                'home__day-dot--today': day.isToday,
                'home__day-dot--past': !day.lit && day.past,
              }"
            >{{ day.lit ? '🔥' : (day.isToday ? '·' : '') }}</span>
            <span class="home__day-label">{{ day.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <div class="home__section-head">
      <h2 class="home__section-title">
        {{ t('common.categories') }}
      </h2>
      <span class="home__section-hint">{{ t('home.categoriesHint', { count: categories.length }) }}</span>
    </div>
    <section class="home__categories">
      <RouterLink
        v-for="cat in openCategories" :key="cat.slug"
        :to="continueTarget(cat)" class="home__category"
      >
        <div class="home__category-top">
          <span class="home__category-icon">{{ cat.icon }}</span>
          <div class="home__category-text">
            <strong class="home__category-title">{{ t(`categories.${cat.slug}.title`) }}</strong>
            <span class="home__category-desc">{{ t(`categories.${cat.slug}.description`) }}</span>
          </div>
          <span class="home__category-go">{{ t('home.continueArrow') }}</span>
        </div>
        <div class="home__category-bottom">
          <div class="home__category-meta">
            <span>{{ t('home.categoryMeta', { done: doneIn(cat), total: cat.items.length, xp: remainingXp(cat) }) }}</span>
            <span class="home__category-pct">{{ t('home.categoryPct', { pct: categoryPercent(cat) }) }}</span>
          </div>
          <div class="home__category-bar">
            <div class="home__category-fill" :style="{ width: `${categoryPercent(cat) * ease}%` }" />
          </div>
        </div>
      </RouterLink>

      <div
        v-for="cat in lockedCategories" :key="cat.slug"
        class="home__category-locked" :title="t('common.soon')"
      >
        <div class="home__locked-top">
          <span class="home__locked-icon">{{ cat.icon }}</span>
          <span class="home__locked-chip">{{ t('common.soon') }}</span>
        </div>
        <strong class="home__locked-title">{{ t(`categories.${cat.slug}.title`) }}</strong>
        <span class="home__locked-desc">{{ t(`categories.${cat.slug}.description`) }}</span>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { TopicCategory } from '@/types/topic'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import DailyQuestBanner from '@/components/home/DailyQuestBanner.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useCountUp } from '@/composables/useCountUp'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

const { t } = useI18n()
const router = useRouter()
const { categories, allModules } = useTopics()
const progress = useProgressStore()

const { ease } = useCountUp()

const level = computed(() => progress.level)
const xpPercent = computed(() => progress.xpPercent)
const xpLeft = computed(() => Math.max(0, progress.xpToNext - progress.totalXp))
const totalEarned = computed(() => progress.totalEarned)
const streak = computed(() => progress.streak)
const completedCount = computed(() => progress.completedCount)
const totalModules = computed(() => allModules.value.length)

const openCategories = computed(() => categories.value.filter(c => c.items.length > 0))
const lockedCategories = computed(() => categories.value.filter(c => c.items.length === 0))

function eased(value: number): number {
  return Math.round(value * ease.value)
}

/* ----- CTA ----- */
const nextModule = computed(() =>
  allModules.value.find(m => !progress.isModuleCompleted(m.slug)) ?? null,
)
const nextModuleTitle = computed(() => nextModule.value?.title ?? t('home.review'))
const nextReward = computed(() =>
  nextModule.value ? progress.rewardFor(nextModule.value.slug, nextModule.value.xpReward) : 0,
)

function continueLearning() {
  const target = nextModule.value ?? allModules.value[0]
  if (target)
    router.push(`/${target.category}/${target.slug}`)
}

/* ----- Week streak ----- */
const weekDots = computed(() => {
  const todayIdx = (new Date().getDay() + 6) % 7
  const labels = t('streak.dayLabels').split(',')
  const todayDone = progress.completedToday
  const backSpan = todayDone ? progress.streak - 1 : progress.streak
  return labels.map((label, i) => {
    const dist = todayIdx - i
    return {
      label,
      lit: (i === todayIdx && todayDone) || (dist > 0 && dist <= backSpan),
      isToday: i === todayIdx,
      past: i < todayIdx,
    }
  })
})

/* ----- Categories ----- */
function doneIn(cat: TopicCategory): number {
  return cat.items.filter(item => progress.isModuleCompleted(item.slug)).length
}

function remainingXp(cat: TopicCategory): number {
  return cat.items
    .filter(item => !progress.isModuleCompleted(item.slug))
    .reduce((sum, item) => sum + item.xpReward, 0)
}

function categoryPercent(cat: TopicCategory): number {
  if (!cat.items.length)
    return 0
  return Math.round((doneIn(cat) / cat.items.length) * 100)
}

function continueTarget(cat: TopicCategory): string {
  const next = cat.items.find(item => !progress.isModuleCompleted(item.slug)) ?? cat.items[0]
  return next ? `/${cat.slug}/${next.slug}` : '/'
}
</script>

<style lang="scss">
@use '@/assets/scss/pages/home' as *;
</style>
