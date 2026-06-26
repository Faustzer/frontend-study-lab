<template>
  <div class="ui-progress" :class="`ui-progress--${size}`">
    <div class="ui-progress__track">
      <div class="ui-progress__fill" :style="{ width: `${percent}%` }" />
    </div>
    <span v-if="showLabel" class="ui-progress__label">{{ percent }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface UiProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<UiProgressBarProps>(), {
  max: 100,
  showLabel: false,
  size: 'md',
})

const percent = computed(() => {
  const pct = Math.min(100, Math.max(0, (props.value / props.max) * 100))
  return Math.round(pct)
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-progress {
  display: flex;
  align-items: center;
  gap: $space-sm;
  width: 100%;

  &__track {
    flex: 1;
    height: 6px;
    background: rgba(28, 31, 22, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $color-accent;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: $color-text-muted;
    min-width: 32px;
    text-align: right;
  }

  &--sm {
    .ui-progress__track {
      height: 4px;
    }
  }

  &--md {
    .ui-progress__track {
      height: 6px;
    }
  }

  &--lg {
    .ui-progress__track {
      height: 8px;
    }
  }
}
</style>
