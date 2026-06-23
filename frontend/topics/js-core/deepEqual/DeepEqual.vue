<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <span class="difficulty difficulty-medium">Medium • +60 XP</span>
      </div>
      <h2>deepEqual</h2>
      <p class="demo-copy">
        {{ $t('modules.deepEqual.description') }}
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>{{ $t('modules.deepEqual.leftLabel') }}</h3>
          <pre>{{ leftValue }}</pre>
        </article>
        <article class="lesson-card">
          <h3>{{ $t('modules.deepEqual.rightLabel') }}</h3>
          <pre>{{ rightValue }}</pre>
        </article>
      </div>

      <div class="result-panel">
        <span class="muted">{{ $t('modules.deepEqual.resultLabel') }}</span>
        <strong>{{ result }}</strong>
      </div>

      <pre class="code">{{ codeExample }}</pre>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('modules.deepEqual.completedBtn') }}</span>
        <span v-else>{{ $t('modules.deepEqual.completeBtn', { xp: 60 }) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { deepEqual } from './deepEqual'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('deepEqual'))

function onComplete() {
  if (completed.value)
    return
  progress.completeModule('deepEqual', 60)
  completed.value = true
}

const left = { user: 'Ann', skills: ['js', 'ts'] }
const right = { user: 'Ann', skills: ['js', 'ts'] }

const leftValue = JSON.stringify(left, null, 2)
const rightValue = JSON.stringify(right, null, 2)
const result = computed(() => deepEqual(left, right))

const codeExample = [
  'const left = { user: "Ann", skills: ["js", "ts"] }',
  'const right = { user: "Ann", skills: ["js", "ts"] }',
  '',
  'deepEqual(left, right) // → true',
  'left === right         // → false',
].join('\n')
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
