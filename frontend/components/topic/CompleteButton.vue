<template>
  <section class="complete">
    <div v-if="!completed" class="complete__row">
      <span ref="buttonWrap" class="complete__btn-wrap">
        <UiButton variant="tactile" size="lg" @click="onComplete">
          {{ t(`modules.${moduleSlug}.completeBtn`, { xp: reward }) }}
        </UiButton>
      </span>
      <span class="complete__hint">{{ t('module.completeHint') }}</span>
    </div>
    <div v-else class="complete__row">
      <span class="complete__done">{{ t(`modules.${moduleSlug}.completedBtn`) }}</span>
      <UiButton
        v-if="nextModule"
        variant="tactile-secondary"
        @click="openNext"
      >
        {{ t('module.next', { module: nextModule.title }) }}
      </UiButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/UiButton.vue'
import { useCelebration } from '@/composables/useCelebration'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

interface Props {
  moduleSlug: string
  xpReward: number
}

const props = defineProps<Props>()
const progress = useProgressStore()
const { t } = useI18n()
const router = useRouter()
const { allModules } = useTopics()
const celebration = useCelebration()

const buttonWrap = useTemplateRef<HTMLElement>('buttonWrap')

const completed = computed(() => progress.isModuleCompleted(props.moduleSlug))
const reward = computed(() => progress.rewardFor(props.moduleSlug, props.xpReward))

const nextModule = computed(() =>
  allModules.value.find(m => m.slug !== props.moduleSlug && !progress.isModuleCompleted(m.slug)) ?? null,
)

function onComplete() {
  if (completed.value)
    return
  const result = progress.completeModule(props.moduleSlug, props.xpReward)
  if (result)
    celebration.celebrateCompletion(result, progress.xpToNext, buttonWrap.value)
}

function openNext() {
  if (nextModule.value)
    router.push(`/${nextModule.value.category}/${nextModule.value.slug}`)
}
</script>

<style lang="scss" scoped>
.complete {
  margin-top: 22px;

  &__row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__hint {
    font-size: 10.5px;
    color: var(--faint);
  }

  &__done {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 22px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--green) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--green) 35%, transparent);
    color: var(--green);
    font-size: 13.5px;
    font-weight: 700;
    animation: popIn 0.4s cubic-bezier(0.5, 1.6, 0.4, 1);
  }
}
</style>
