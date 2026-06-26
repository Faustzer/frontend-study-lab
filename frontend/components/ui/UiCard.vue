<template>
  <div
    class="ui-card"
    :class="[`ui-card--${padding}`, { 'ui-card--hoverable': hoverable }]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
export interface UiCardProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

withDefaults(defineProps<UiCardProps>(), {
  padding: 'md',
  hoverable: false,
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.ui-card {
  @include glass-card;

  &--none {
    padding: 0;
  }

  &--sm {
    padding: $space-md;
  }

  &--md {
    padding: $space-lg;
  }

  &--lg {
    padding: $space-xl;
  }

  &--hoverable {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 64px rgba(28, 31, 22, 0.12);
    }
  }
}
</style>
