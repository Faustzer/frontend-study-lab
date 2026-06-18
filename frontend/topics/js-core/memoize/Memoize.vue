<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">JavaScript Core</p>
        <span class="difficulty difficulty-easy">Easy • +30 XP</span>
      </div>
      <h2>memoize</h2>
      <p class="demo-copy">
        Memoize кеширует результат функции по аргументам. При повторном вызове
        с теми же аргументами результат берётся из кеша без повторного вычисления.
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>Input</h3>
          <p>{{ inputLabel }}</p>
        </article>
        <article class="lesson-card">
          <h3>Result</h3>
          <p>{{ result }}</p>
        </article>
      </div>

      <div class="result-panel">
        <span class="muted">Сколько раз реально считали</span>
        <strong>{{ calculations }}</strong>
      </div>

      <pre class="code">{{ codeExample }}</pre>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">✓ Завершено</span>
        <span v-else>Завершить модуль → +30 XP</span>
      </button>
    </div>
  </section>
</template>
<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { memoize } from './memoize'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('memoize'))

function onComplete() {
  if (completed.value) return
  progress.completeModule('memoize', 30)
  completed.value = true
}

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

