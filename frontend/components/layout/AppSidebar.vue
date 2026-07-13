<template>
  <aside class="sidebar" :class="{ open: ui.mobileSidebarOpen }">
    <div class="sidebar__brand">
      <img class="sidebar__logo" src="@/assets/images/logo.svg" alt="Fsl">
      <RouterLink class="sidebar__brand-text" to="/" @click="ui.closeMobileSidebar()">
        <strong>Frontend Study Lab</strong>
        <span>practice first</span>
      </RouterLink>
      <button class="sidebar__icon-btn" :title="t('common.toggleTheme')" :aria-label="t('common.toggleTheme')" @click="ui.toggleTheme()">
        {{ ui.theme === 'dark' ? '☀️' : '🌙' }}
      </button>
      <LanguageSwitcher />
    </div>

    <PlayerCard />

    <nav class="sidebar__nav">
      <RouterLink
        class="sidebar__nav-link" :class="{ active: currentPath === '/' }"
        to="/" @click="ui.closeMobileSidebar()"
      >
        <span class="sidebar__nav-icon">⌂</span> {{ t('common.dashboard') }}
      </RouterLink>
    </nav>

    <section
      v-for="cat in openCategories" :key="cat.slug" class="sidebar__group"
      :class="{ collapsed: ui.isCategoryCollapsed(cat.slug) }"
    >
      <button
        class="sidebar__group-head"
        :aria-expanded="!ui.isCategoryCollapsed(cat.slug)"
        @click="ui.toggleCategory(cat.slug)"
      >
        <span class="sidebar__group-icon">{{ cat.icon }}</span>
        <span class="sidebar__group-title">{{ t(`categories.${cat.slug}.title`) }}</span>
        <span class="sidebar__group-count">{{ doneIn(cat) }}/{{ cat.items.length }}</span>
      </button>
      <div v-show="!ui.isCategoryCollapsed(cat.slug)" class="sidebar__modules">
        <RouterLink
          v-for="item in cat.items" :key="item.slug"
          class="sidebar__module"
          :class="{ active: currentPath === `/${cat.slug}/${item.slug}` }"
          :to="`/${cat.slug}/${item.slug}`"
          @click="ui.closeMobileSidebar()"
        >
          <span class="sidebar__module-title">{{ item.title }}</span>
          <span v-if="isCompleted(item.slug)" class="sidebar__module-check">✓</span>
          <span v-else class="sidebar__module-xp">+{{ item.xpReward }}</span>
        </RouterLink>
      </div>
    </section>

    <section v-if="lockedCategories.length" class="sidebar__locked">
      <span class="sidebar__locked-title">{{ t('common.soon') }}</span>
      <div
        v-for="cat in lockedCategories" :key="cat.slug"
        class="sidebar__locked-row" :title="t('common.soon')"
      >
        <span class="sidebar__locked-icon">{{ cat.icon }}</span>
        <span class="sidebar__locked-name">{{ t(`categories.${cat.slug}.title`) }}</span>
        <span class="sidebar__locked-lock">🔒</span>
      </div>
    </section>

    <div class="sidebar__bottom">
      <template v-if="auth.isAuthenticated">
        <RouterLink class="sidebar__user" to="/profile" @click="ui.closeMobileSidebar()">
          <img v-if="auth.userAvatar" :src="auth.userAvatar" :alt="auth.userDisplayName" class="sidebar__user-avatar">
          <span class="sidebar__user-name">{{ auth.userDisplayName }}</span>
        </RouterLink>
        <button class="sidebar__logout" @click="handleLogout">
          {{ t('auth.logout') }}
        </button>
      </template>
      <UiButton v-else variant="tactile-secondary" size="sm" @click="ui.openAuthModal()">
        {{ t('auth.loginSave') }}
      </UiButton>
      <button class="sidebar__reset" :class="{ 'sidebar__reset--confirm': confirmingReset }" @click="handleReset">
        {{ confirmingReset ? t('common.resetConfirm') : t('common.resetProgress') }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import PlayerCard from '@/components/layout/PlayerCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useTopics } from '@/composables/useTopics'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useUiStore } from '@/stores/ui'
import type { TopicCategory } from '@/types/topic'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { categories } = useTopics()
const auth = useAuthStore()
const progress = useProgressStore()
const ui = useUiStore()

const currentPath = computed(() => route.path)
const openCategories = computed(() => categories.value.filter(c => c.items.length > 0))
const lockedCategories = computed(() => categories.value.filter(c => c.items.length === 0))

function isCompleted(slug: string) {
  return progress.isModuleCompleted(slug)
}

function doneIn(cat: TopicCategory) {
  return cat.items.filter(item => progress.isModuleCompleted(item.slug)).length
}

// Сброс в два клика вместо confirm(): второй клик в течение 3 секунд
const confirmingReset = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function handleReset() {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirmingReset.value = false
    }, 3000)
    return
  }
  clearTimeout(confirmTimer)
  confirmingReset.value = false
  progress.resetProgress()
}

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>
