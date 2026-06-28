<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`]"
        role="alert"
      >
        <span class="toast__icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ' }}
        </span>
        <span class="toast__message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.toast-container {
  position: fixed;
  top: $space-lg;
  right: $space-lg;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  pointer-events: none;

  @media (max-width: $breakpoint-sm) {
    left: $space-md;
    right: $space-md;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 500;
  pointer-events: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 240px;
  max-width: 400px;

  &--success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--error {
    background: #ffebee;
    color: #c62828;
  }

  &--info {
    background: #e3f2fd;
    color: #1565c0;
  }

  &__icon {
    font-weight: 700;
    flex-shrink: 0;
  }

  &__message {
    flex: 1;
  }
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.toast-move {
  transition: transform 0.2s ease;
}
</style>
