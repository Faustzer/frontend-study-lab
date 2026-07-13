<template>
  <section class="topic">
    <RouterLink class="topic__back" to="/">
      ← {{ t('common.dashboard') }}
    </RouterLink>

    <header class="topic__header">
      <div class="topic__chips">
        <span class="topic__chip topic__chip--cat">{{ categoryLabel }}</span>
        <span class="topic__chip" :class="`topic__chip--${difficulty}`">{{ t(`difficulty.${difficulty}`) }}</span>
        <span class="topic__chip topic__chip--xp">+{{ xpReward }} XP</span>
        <span v-if="questActive" class="topic__chip topic__chip--quest">⚡ {{ t('quest.x2') }}</span>
      </div>
      <h1 class="topic__title">
        {{ title }}
      </h1>
      <p v-if="description" class="topic__desc">
        {{ description }}
      </p>
      <div v-if="tags.length" class="topic__tags">
        <span v-for="tag in tags" :key="tag" class="topic__tag">#{{ tag }}</span>
      </div>
    </header>

    <section class="topic__demo">
      <div class="topic__demo-head">
        <span class="topic__demo-overline">{{ t('demo.overline') }}</span>
        <span class="topic__demo-live"><span class="topic__demo-dot" />live</span>
      </div>
      <slot />
    </section>

    <section v-if="sourceCode" class="topic__code">
      <div class="topic__code-bar">
        <span class="topic__code-light topic__code-light--red" />
        <span class="topic__code-light topic__code-light--yellow" />
        <span class="topic__code-light topic__code-light--green" />
        <span class="topic__code-path">{{ sourceLabel }}</span>
      </div>
      <pre class="topic__code-pre">{{ sourceCode }}</pre>
    </section>

    <CompleteButton :module-slug="moduleSlug" :xp-reward="xpReward" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

interface Props {
  moduleSlug: string
  title: string
  description?: string
  categoryLabel: string
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
}

const props = defineProps<Props>()
const { t } = useI18n()
const { allModules } = useTopics()
const progress = useProgressStore()

const questActive = computed(() => progress.isQuestActive(props.moduleSlug))

const currentModule = computed(() =>
  allModules.value.find(m => m.slug === props.moduleSlug) ?? null,
)
const tags = computed(() => currentModule.value?.tags ?? [])

// Исходник реализации модуля — для тёмного код-блока
const sourceModules = import.meta.glob('@/topics/*/*/*.ts', { query: '?raw', import: 'default' })
const sourceCode = ref('')
const sourceLabel = ref('')

onMounted(async () => {
  const sourcePath = currentModule.value?.sourcePath
  if (!sourcePath)
    return
  const folder = sourcePath.slice(0, sourcePath.lastIndexOf('/') + 1)
  const entry = Object.entries(sourceModules).find(([path]) => path.startsWith(folder))
  if (!entry)
    return
  sourceLabel.value = entry[0].replace(/^\//, '')
  sourceCode.value = ((await entry[1]()) as string).trimEnd()
})
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
