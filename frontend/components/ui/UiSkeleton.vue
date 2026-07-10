<template>
  <div
    class="ui-skeleton"
    :class="`ui-skeleton--${variant}`"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
export interface UiSkeletonProps {
  variant?: 'text' | 'rect' | 'circle'
  width?: string
  height?: string
}

withDefaults(defineProps<UiSkeletonProps>(), {
  variant: 'text',
  width: '100%',
  height: undefined,
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-skeleton {
  position: relative;
  overflow: hidden;
  background: color-mix(in srgb, $color-text 8%, transparent);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, $color-text 6%, transparent),
      transparent
    );
    animation: ui-skeleton-shimmer 1.4s ease-in-out infinite;
  }

  &--text {
    height: 1em;
    border-radius: 6px;
  }

  &--rect {
    height: 80px;
    border-radius: $radius-md;
  }

  &--circle {
    border-radius: 50%;
    aspect-ratio: 1;
  }
}

@keyframes ui-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton::after {
    animation: none;
  }
}
</style>
