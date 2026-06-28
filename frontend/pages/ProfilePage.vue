<template>
  <section class="profile-page">
    <h2 class="profile-page__title">
      {{ t('profile.title') }}
    </h2>

    <UserCard />

    <ProgressStats />

    <div class="profile-page__modules">
      <h3 class="profile-page__subtitle">
        {{ t('profile.completedModules') }}
      </h3>
      <ul v-if="progress.completedCount > 0" class="profile-page__module-list">
        <li
          v-for="slug in progress.completedModules"
          :key="slug"
          class="profile-page__module-item"
        >
          <span class="profile-page__module-check">✓</span>
          <span class="profile-page__module-slug">{{ humanize(slug) }}</span>
        </li>
      </ul>
      <p v-else class="profile-page__empty">
        {{ t('profile.noModules') }}
      </p>
    </div>

    <div class="profile-page__actions">
      <UiButton variant="ghost" @click="handleLogout">
        {{ t('auth.logout') }}
      </UiButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import UserCard from '@/components/profile/UserCard.vue'
import ProgressStats from '@/components/profile/ProgressStats.vue'
import UiButton from '@/components/ui/UiButton.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const progress = useProgressStore()

function humanize(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.profile-page {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
  max-width: 600px;
  margin: 0 auto;
  padding: $space-xl 0;

  &__title {
    font-size: 22px;
    font-weight: 800;
    margin: 0;
    color: $color-text;
  }

  &__subtitle {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-text-muted;
    margin: 0 0 $space-sm;
  }

  &__modules {
    display: flex;
    flex-direction: column;
  }

  &__module-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__module-item {
    display: flex;
    align-items: center;
    gap: $space-sm;
    padding: $space-sm $space-md;
    background: $color-bg-card;
    border-radius: $radius-sm;
    border: 1px solid $color-border;
  }

  &__module-check {
    color: $color-success;
    font-weight: 700;
  }

  &__module-slug {
    font-size: 14px;
    color: $color-text;
  }

  &__empty {
    font-size: 14px;
    color: $color-text-muted;
    margin: 0;
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    padding-top: $space-md;
    border-top: 1px solid $color-border;
  }
}
</style>
