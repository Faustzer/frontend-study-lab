<template>
  <aside class="sidebar" :class="{ open: ui.mobileSidebarOpen }">
    <div class="sidebar-header">
      <LanguageSwitcher />
      <div class="user-stats">
        <div class="stat">
          <span class="stat-label">{{ t('common.level') }}</span>
          <span class="stat-value">{{ level }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">{{ t('common.xp') }}</span>
          <span class="stat-value">{{ xp }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">{{ t('common.done') }}</span>
          <span class="stat-value">{{ completedCount }}/{{ totalModules }}</span>
        </div>
      </div>
      <UiProgressBar :value="xpPercent" />
    </div>

    <nav class="nav">
      <RouterLink class="nav-link" :class="{ active: currentPath === '/' }" to="/" @click="ui.closeMobileSidebar()">
        🏠 {{ t('common.dashboard') }}
      </RouterLink>
    </nav>

    <div class="categories">
      <section
        v-for="cat in categories" :key="cat.slug" class="category"
        :class="{ collapsed: ui.isCategoryCollapsed(cat.slug) }"
      >
        <h2 @click="ui.toggleCategory(cat.slug)">
          <span class="cat-arrow" :class="{ open: !ui.isCategoryCollapsed(cat.slug) }">▸</span>
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-title">{{ t(`categories.${cat.slug}.title`) }}</span>
          <span class="cat-count">{{ cat.items.length }}</span>
        </h2>
        <ul v-show="!ui.isCategoryCollapsed(cat.slug)">
          <li v-for="item in cat.items" :key="item.slug" class="topic-li">
            <RouterLink
              :to="`/${cat.slug}/${item.slug}`"
              :class="{ active: currentPath === `/${cat.slug}/${item.slug}` }" @click="ui.closeMobileSidebar()"
            >
              <span class="topic-title">{{ item.title }}</span>
              <span v-if="isCompleted(item.slug)" class="check">✓</span>
              <span v-else class="xp-badge">+{{ item.xpReward }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import UiProgressBar from '@/components/ui/UiProgressBar.vue'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const route = useRoute()
const { categories, allModules } = useTopics()
const progress = useProgressStore()
const ui = useUiStore()

const currentPath = computed(() => route.path)
const level = computed(() => progress.level)
const xp = computed(() => progress.totalXp)
const xpPercent = computed(() => progress.xpPercent)
const completedCount = computed(() => progress.completedCount)
const totalModules = computed(() => allModules.value.length)

function isCompleted(slug: string) {
  return progress.isModuleCompleted(slug)
}
</script>
