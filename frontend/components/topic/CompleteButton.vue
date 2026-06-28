<template>
  <button
    class="complete-btn"
    :class="{ completed }"
    @click="onComplete"
  >
    <span v-if="completed">{{ t(`modules.${moduleSlug}.completedBtn`) }}</span>
    <span v-else>{{ t(`modules.${moduleSlug}.completeBtn`, { xp: xpReward }) }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'

interface Props {
  moduleSlug: string
  xpReward: number
}

const props = defineProps<Props>()
const progress = useProgressStore()
const { t } = useI18n()
const toast = useToast()

const completed = computed(() => progress.isModuleCompleted(props.moduleSlug))

function onComplete() {
  if (completed.value) {
    return
  }
  progress.completeModule(props.moduleSlug, props.xpReward)
  toast.success(`+${props.xpReward} XP!`)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.complete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: $space-md $space-xl;
  border: none;
  border-radius: $radius-lg;
  background: $color-accent;
  color: white;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.completed) {
    background: color-mix(in srgb, $color-accent 85%, black);
    transform: translateY(-1px);
  }

  &.completed {
    background: $color-success;
    cursor: default;
  }
}
</style>
