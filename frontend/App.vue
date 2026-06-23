<template>
  <div class="shell">
    <!-- Mobile header -->
    <header class="mobile-header">
      <button class="burger" :class="{ open: sidebarOpen }" @click="sidebarOpen = !sidebarOpen">
        <span />
        <span />
        <span />
      </button>
      <div class="mobile-brand">
        <span class="mobile-level">Lv.{{ level }}</span>
        <span class="brand-title">Frontend Study Lab</span>
      </div>
      <div class="mobile-xp">
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: `${xpPercent}%` }" />
        </div>
        <span class="xp-text">{{ xp }} {{ $t('common.xp') }}</span>
      </div>
    </header>

    <!-- Sidebar overlay for mobile -->
    <div v-if="sidebarOpen" class="overlay" @click="sidebarOpen = false" />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <!-- <div class="sidebar-profile">
          avatar
          nickname
        </div> -->
        <LanguageSwitcher />
        <div class="user-stats">
          <div class="stat">
            <span class="stat-label">{{ $t('common.level') }}</span>
            <span class="stat-value">{{ level }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">{{ $t('common.xp') }}</span>
            <span class="stat-value">{{ xp }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">{{ $t('common.done') }}</span>
            <span class="stat-value">{{ completedCount }}/{{ totalModules }}</span>
          </div>
        </div>
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: `${xpPercent}%` }" />
        </div>
      </div>

      <nav class="nav">
        <RouterLink class="nav-link" :class="{ active: currentPath === '/' }" to="/" @click="sidebarOpen = false">
          🏠 {{ $t('common.dashboard') }}
        </RouterLink>
      </nav>

      <div class="categories">
        <section
          v-for="cat in categories" :key="cat.slug" class="category"
          :class="{ collapsed: isCollapsed(cat.slug) }"
        >
          <h2 @click="toggleCategory(cat.slug)">
            <span class="cat-arrow" :class="{ open: !isCollapsed(cat.slug) }">▸</span>
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-title">{{ $t(`categories.${cat.slug}.title`) }}</span>
            <span class="cat-count">{{ cat.items.length }}</span>
          </h2>
          <ul v-show="!isCollapsed(cat.slug)">
            <li v-for="item in cat.items" :key="item.slug" class="topic-li">
              <RouterLink
                :to="`/${cat.slug}/${item.slug}`"
                :class="{ active: currentPath === `/${cat.slug}/${item.slug}` }" @click="sidebarOpen = false"
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

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const { categories, allModules } = useTopics()
const progress = useProgressStore()

const currentPath = computed(() => route.path)
const sidebarOpen = ref(false)
const STORAGE_KEY = 'frontend-study-lab-collapsed'

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return new Set(JSON.parse(raw))
  }
  catch { /* ignore */ }
  return new Set()
}

function saveCollapsed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

const collapsedCategories = ref<Set<string>>(loadCollapsed())

function toggleCategory(slug: string) {
  if (collapsedCategories.value.has(slug)) {
    collapsedCategories.value.delete(slug)
  }
  else {
    collapsedCategories.value.add(slug)
  }
  saveCollapsed(collapsedCategories.value)
}

function isCollapsed(slug: string): boolean {
  return collapsedCategories.value.has(slug)
}

const level = computed(() => progress.level)
const xp = computed(() => progress.totalXp)
const xpPercent = computed(() => progress.xpPercent)
const completedCount = computed(() => progress.completedCount)
const totalModules = computed(() => allModules.value.length)

function isCompleted(slug: string) {
  return progress.isModuleCompleted(slug)
}
</script>

<style lang="scss">
@use '@/assets/scss/pages/app' as *;
</style>
