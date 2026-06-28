<template>
  <button
    class="ui-btn"
    :class="[`ui-btn--${variant}`, `ui-btn--${size}`]"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
export interface UiButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<UiButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-sm;
  border: none;
  border-radius: $radius-md;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Variants
  &--primary {
    background: $color-accent;
    color: white;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, $color-accent 85%, black);
    }
  }

  &--secondary {
    background: $color-accent-light;
    color: $color-accent;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, $color-accent 20%, transparent);
    }
  }

  &--ghost {
    background: transparent;
    color: $color-text;

    &:hover:not(:disabled) {
      background: $color-bg-card;
    }
  }

  // Sizes
  &--sm {
    padding: $space-xs $space-md;
    font-size: 12px;
  }

  &--md {
    padding: $space-sm $space-lg;
    font-size: 14px;
  }

  &--lg {
    padding: $space-md $space-xl;
    font-size: 16px;
  }
}
</style>
