<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="easy" :xp="30" />
      </div>
      <h2>memoize</h2>
      <p class="demo-copy">
        {{ $t('modules.memoize.description') }}
      </p>

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

      <CompleteButton module-slug="memoize" :xp-reward="30" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { memoize } from './memoize'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

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
  'expensiveSum(10, 15) // считает → 25',
  'expensiveSum(10, 15) // из кеша → 25',
].join('\n')
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
