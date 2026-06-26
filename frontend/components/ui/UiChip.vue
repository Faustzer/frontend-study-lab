<template>
  <span class="ui-chip" :class="[`ui-chip--${variant}`, `ui-chip--${size}`]">
    <slot />
    <button
      v-if="removable"
      class="ui-chip__remove"
      aria-label="Remove"
      @click.stop="emit('remove')"
    >
      &times;
    </button>
  </span>
</template>

<script setup lang="ts">
export interface UiChipProps {
  variant?: 'default' | 'primary' | 'success' | 'warning'
  size?: 'sm' | 'md'
  removable?: boolean
}

withDefaults(defineProps<UiChipProps>(), {
  variant: 'default',
  size: 'md',
  removable: false,
})

const emit = defineEmits<{
  remove: []
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: $space-xs;
  padding: $space-xs $space-md;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;

  &--sm {
    padding: 2px $space-sm;
    font-size: 11px;
  }

  &--md {
    padding: $space-xs $space-md;
    font-size: 12px;
  }

  &--default {
    background: rgba(28, 31, 22, 0.06);
    color: $color-text;
  }

  &--primary {
    background: $color-accent-light;
    color: $color-accent;
  }

  &--success {
    background: rgba($color-success, 0.12);
    color: $color-success;
  }

  &--warning {
    background: rgba($color-medium, 0.12);
    color: $color-medium;
  }

  &__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    font-size: 14px;
    cursor: pointer;
    color: inherit;
    opacity: 0.6;
    border-radius: 50%;

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.08);
    }
  }
}
</style>
