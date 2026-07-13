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
  variant?: 'primary' | 'secondary' | 'ghost' | 'tactile' | 'tactile-secondary'
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

  // Тактильная (3D) кнопка — ключевой паттерн редизайна
  &--tactile {
    border-radius: 14px;
    background: var(--accent);
    color: white;
    font-weight: 700;
    box-shadow: 0 4px 0 var(--accent-deep);
    transition:
      transform 0.12s,
      box-shadow 0.12s,
      filter 0.15s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 5px 0 var(--accent-deep);
      filter: brightness(1.06);
    }

    &:active:not(:disabled) {
      transform: translateY(3px);
      box-shadow: 0 1px 0 var(--accent-deep);
    }
  }

  // Вторичная тактильная — без 3D-грани
  &--tactile-secondary {
    border: 1px solid var(--accent-line);
    border-radius: 14px;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 700;
    transition:
      transform 0.12s,
      background 0.15s;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--accent) 18%, transparent);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
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

  // Точные размеры прототипа для тактильных кнопок
  &--tactile,
  &--tactile-secondary {
    &.ui-btn--sm {
      padding: 11px 18px;
      font-size: 12.5px;
    }

    &.ui-btn--md {
      padding: 13px 22px;
      font-size: 13.5px;
    }

    &.ui-btn--lg {
      padding: 14px 26px;
      font-size: 14px;
    }
  }
}
</style>
