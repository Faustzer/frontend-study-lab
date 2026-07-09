<template>
  <button
    class="auth-btn"
    :class="[`auth-btn--${provider}`]"
    :disabled="disabled"
    type="button"
    @click="handleLogin"
  >
    <span class="auth-btn__icon" aria-hidden="true">
      <svg v-if="provider === 'google'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.24c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.71 7.73 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 3.99 3.29 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <svg v-else-if="provider === 'twitch'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.571 4.714H13.714V10H11.571V4.714zM16.286 4.714H18.429V10H16.286V4.714z" fill="white" />
        <path d="M4.857 1L1 4.857V19.143H5.571V23L9.429 19.143H12.571L21 10.714V1H4.857zM18.857 9.857L15.286 13.429H12.143L9.286 16.286V13.429H5.571V2.857H18.857V9.857z" fill="white" />
      </svg>
      <svg v-else-if="provider === 'discord'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.441.872-.604 1.256a18.26 18.26 0 0 0-5.498 0 12.64 12.64 0 0 0-.613-1.256.077.077 0 0 0-.079-.037A19.742 19.742 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.993a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.121c.126-.1.252-.202.373-.304a.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.01c.12.103.246.206.373.305a.077.077 0 0 1-.006.121 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.04.107c.35.698.762 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.534-5.177-.897-9.674-3.723-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="white" />
      </svg>
    </span>
    <span class="auth-btn__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export interface AuthButtonProps {
  provider: 'google' | 'twitch' | 'discord'
  disabled?: boolean
}

const props = withDefaults(defineProps<AuthButtonProps>(), {
  disabled: false,
})

const auth = useAuthStore()
const { t } = useI18n()

const providerLabels: Record<string, string> = {
  google: 'Google',
  twitch: 'Twitch',
  discord: 'Discord',
}

const label = computed(() => {
  const name = providerLabels[props.provider] ?? props.provider
  return t('auth.loginWith', { provider: name })
})

function handleLogin() {
  if (props.disabled)
    return
  auth.login(props.provider)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.auth-btn {
  display: inline-flex;
  align-content: center;
  justify-content: center;
  gap: $space-sm;
  width: 100%;
  padding: $space-md $space-lg;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  background: white;
  color: $color-text;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  // Provider variants
  &--google {
    color: black;
    &:hover:not(:disabled) {
      background: #fcfafa;
    }
  }

  &--twitch {
    background: #9146ff;
    color: white;
    border-color: #9146ff;

    &:hover:not(:disabled) {
      background: #7c3ced;
      border-color: #7c3ced;
    }
  }

  &--discord {
    background: #5865f2;
    color: white;
    border-color: #5865f2;

    &:hover:not(:disabled) {
      background: #4752c4;
      border-color: #4752c4;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__label {
    white-space: nowrap;
  }
}
</style>
