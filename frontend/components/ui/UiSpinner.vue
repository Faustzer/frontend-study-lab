<template>
  <div class="ui-spinner" :class="`ui-spinner--${size}`" role="status" aria-label="Loading">
    <span class="ui-spinner__circle" />
  </div>
</template>

<script setup lang="ts">
export interface UiSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<UiSpinnerProps>(), {
  size: 'md',
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__circle {
    display: block;
    border-radius: 50%;
    border: 2px solid rgba($color-accent, 0.2);
    border-top-color: $color-accent;
    animation: ui-spinner-rotate 0.6s linear infinite;
  }

  &--sm {
    width: 16px;
    height: 16px;
    .ui-spinner__circle {
      width: 16px;
      height: 16px;
    }
  }

  &--md {
    width: 24px;
    height: 24px;
    .ui-spinner__circle {
      width: 24px;
      height: 24px;
    }
  }

  &--lg {
    width: 32px;
    height: 32px;
    .ui-spinner__circle {
      width: 32px;
      height: 32px;
    }
  }
}

@keyframes ui-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
