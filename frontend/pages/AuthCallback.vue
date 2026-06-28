<template>
  <div class="auth-callback">
    <div v-if="status === 'loading'" class="auth-callback__loading">
      <span class="auth-callback__spinner" />
      <p class="auth-callback__text">
        {{ t('auth.callbackLoading') }}
      </p>
    </div>

    <div v-else-if="status === 'success'" class="auth-callback__success">
      <span class="auth-callback__check">✓</span>
      <p class="auth-callback__text">
        {{ t('auth.callbackSuccess') }}
      </p>
    </div>

    <div v-else class="auth-callback__error">
      <span class="auth-callback__cross">✗</span>
      <p class="auth-callback__text">
        {{ t('auth.callbackError') }}
      </p>
      <button class="auth-callback__retry" @click="goHome">
        {{ t('auth.callbackRetry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onMounted, ref } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()

type CallbackStatus = 'loading' | 'success' | 'error'

const status = ref<CallbackStatus>('loading')

function goHome() {
  router.push({ name: 'home' })
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const success = auth.handleCallback(params)

  if (success) {
    status.value = 'success'
    // Redirect to home after a brief delay so the user sees the success state
    setTimeout(() => {
      router.push({ name: 'home' })
    }, 800)
  }
  else {
    status.value = 'error'
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: $space-xl;

  &__loading,
  &__success,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-md;
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $color-border;
    border-top-color: $color-accent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__check {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: $color-success;
    border: 2px solid $color-success;
    border-radius: 50%;
  }

  &__cross {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: $color-hard;
    border: 2px solid $color-hard;
    border-radius: 50%;
  }

  &__text {
    font-size: 16px;
    color: $color-text;
    text-align: center;
  }

  &__retry {
    margin-top: $space-sm;
    padding: $space-sm $space-lg;
    border: 1px solid $color-accent;
    border-radius: $radius-md;
    background: transparent;
    color: $color-accent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: $color-accent;
      color: white;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
