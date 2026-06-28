<template>
  <div class="user-card">
    <img v-if="auth.userAvatar" :src="auth.userAvatar" :alt="auth.userDisplayName" class="user-card__avatar">
    <div v-else class="user-card__avatar-placeholder">
      {{ auth.userDisplayName.charAt(0).toUpperCase() }}
    </div>
    <div class="user-card__info">
      <span class="user-card__name">{{ auth.userDisplayName }}</span>
      <span v-if="auth.user?.email" class="user-card__email">{{ auth.user.email }}</span>
      <span class="user-card__provider">
        {{ t(`profile.provider.${auth.userProvider}`) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.user-card {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-lg;
  background: $color-bg-card;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
}

.user-card__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-card__avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $color-accent-light;
  color: $color-accent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-card__name {
  font-size: 16px;
  font-weight: 700;
  color: $color-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card__email {
  font-size: 13px;
  color: $color-text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card__provider {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $color-text-faint;
  margin-top: 2px;
}
</style>
