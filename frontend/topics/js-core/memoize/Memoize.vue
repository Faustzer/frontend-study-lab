<template>
  <TopicPage
    module-slug="memoize"
    title="memoize"
    :description="$t('modules.memoize.description')"
    category-label="JavaScript Core"
    difficulty="easy"
    :xp-reward="30"
  >
    <div class="lesson-grid">
      <article class="lesson-card">
        <h3>{{ $t('modules.memoize.inputLabel') }}</h3>
        <CodeBlock language="code">
          {{ inputLabel }}
        </CodeBlock>
      </article>
      <article class="lesson-card">
        <h3>{{ $t('modules.memoize.resultLabel') }}</h3>
        <CodeBlock language="code">
          {{ result }}
        </CodeBlock>
      </article>
    </div>

    <div class="result-panel">
      <span class="muted">{{ $t('modules.memoize.calcCountLabel') }}</span>
      <strong>{{ calculations }}</strong>
    </div>

    <CodeBlock language="javascript">
      {{ codeExample }}
    </CodeBlock>
  </TopicPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { memoize } from './memoize'
import TopicPage from '@/components/layout/TopicPage.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'

const calculations = ref(0)

const expensiveSum = memoize((a: number, b: number): number => {
  calculations.value += 1
  return a + b
})

const inputLabel = 'expensiveSum(10, 15)'
const result = computed(() => {
  expensiveSum(10, 15)
  return expensiveSum(10, 15)
})

const codeExample = [
  'const expensiveSum = memoize((a, b) => {',
  '  calculations += 1',
  '  return a + b',
  '})',
  '',
  'expensiveSum(10, 15) // computes → 25',
  'expensiveSum(10, 15) // from cache → 25',
].join('\n')
</script>
