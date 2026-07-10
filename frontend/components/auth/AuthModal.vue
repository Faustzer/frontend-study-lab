<template>
  <UiModal :open="ui.authModalOpen" :title="t('auth.modalTitle')" size="sm" @close="ui.closeAuthModal()">
    <p class="auth-modal__warning">
      {{ t('auth.modalWarning') }}
    </p>
    <div class="auth-modal__buttons">
      <AuthButton provider="google" />
      <!-- Twitch/Discord OAuth is not configured on the backend yet -->
      <!-- <AuthButton provider="twitch" /> -->
      <!-- <AuthButton provider="discord" /> -->
    </div>
    <button v-if="isDev" class="auth-modal__dev" @click="devLogin">
      🛠 Dev Login (mock)
    </button>
    <button class="auth-modal__skip" @click="ui.closeAuthModal()">
      {{ t('auth.modalSkip') }}
    </button>
  </UiModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import AuthButton from '@/components/auth/AuthButton.vue'
import UiModal from '@/components/ui/UiModal.vue'
import type { User } from '@/api/types'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const isDev = import.meta.env.DEV

const mockUser: User = {
  id: 'dev-user-1',
  email: 'dev@test.com',
  displayName: 'Dev User',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
  provider: 'google',
  createdAt: new Date().toISOString(),
}

function devLogin() {
  auth.setSession('dev-mock-token', mockUser)
  ui.closeAuthModal()
  router.push({ name: 'home' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.auth-modal__warning {
  margin: 0 0 $space-lg;
  font-size: 14px;
  line-height: 1.6;
  color: $color-text-muted;
}

.auth-modal__buttons {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  margin-bottom: $space-lg;
}

.auth-modal__dev {
  display: block;
  width: 100%;
  padding: $space-sm $space-md;
  border: 1px dashed $color-accent;
  border-radius: $radius-md;
  background: color-mix(in srgb, $color-accent 5%, transparent);
  color: $color-accent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: $space-md;
  transition: all 0.15s ease;

  &:hover {
    background: color-mix(in srgb, $color-accent 12%, transparent);
  }
}

.auth-modal__skip {
  display: block;
  width: 100%;
  padding: $space-sm;
  border: none;
  background: transparent;
  color: $color-text-faint;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: color 0.15s ease;

  &:hover {
    color: $color-text-muted;
  }
}
</style>
