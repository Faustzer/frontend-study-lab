<template>
  <span class="ui-badge" :class="`ui-badge--${difficulty}`">
    {{ difficultyLabels[difficulty] }}
    <template v-if="showXp && xp">&bull; +{{ xp }} XP</template>
  </span>
</template>

<script setup lang="ts">
export interface UiBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard'
  xp?: number
  showXp?: boolean
}

withDefaults(defineProps<UiBadgeProps>(), {
  xp: 0,
  showXp: true,
})

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  vertical-align: middle;

  &--easy {
    background: rgba($color-easy, 0.12);
    color: $color-easy;
  }

  &--medium {
    background: rgba($color-medium, 0.12);
    color: $color-medium;
  }

  &--hard {
    background: rgba($color-hard, 0.12);
    color: $color-hard;
  }
}
</style>
