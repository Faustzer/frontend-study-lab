<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <span class="difficulty difficulty-medium">Medium • +60 XP</span>
      </div>
      <h2>curry</h2>
      <p class="demo-copy">
        {{ $t('modules.curry.description') }}
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>{{ $t('modules.curry.beforeLabel') }}</h3>
          <p>{{ $t('modules.curry.beforeText') }}</p>
          <pre>buildUrl('/users', { page: 1 }, 'json')</pre>
        </article>
        <article class="lesson-card">
          <h3>{{ $t('modules.curry.afterLabel') }}</h3>
          <p>{{ $t('modules.curry.afterText') }}</p>
          <pre>curriedBuildUrl('/users')({ page: 1 })('json')</pre>
        </article>
      </div>

      <div class="flow">
        <div class="flow-step">
          <span class="step-number">1</span>
          <strong>{{ $t('modules.curry.step1') }}</strong>
          <code>'/users'</code>
        </div>
        <div class="flow-step">
          <span class="step-number">2</span>
          <strong>{{ $t('modules.curry.step2') }}</strong>
          <code>(query) => ...</code>
        </div>
        <div class="flow-step">
          <span class="step-number">3</span>
          <strong>{{ $t('modules.curry.step3') }}</strong>
          <code>{ page: 1 }</code>
        </div>
        <div class="flow-step">
          <span class="step-number">4</span>
          <strong>{{ $t('modules.curry.step4') }}</strong>
          <code>'json'</code>
        </div>
      </div>

      <div class="result-panel">
        <span class="muted">{{ $t('modules.curry.resultLabel') }}</span>
        <strong>{{ url }}</strong>
      </div>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('modules.curry.completedBtn') }}</span>
        <span v-else>{{ $t('modules.curry.completeBtn', { xp: 60 }) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { curry } from './curry'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('curry'))

function onComplete() {
  if (completed.value)
    return
  progress.completeModule('curry', 60)
  completed.value = true
}

const buildUrl = curry((endpoint: string, query: Record<string, number>, format: string) => {
  const params = new URLSearchParams(query as any).toString()
  return `https://api.example.com${endpoint}?${params}&format=${format}`
})

const url = buildUrl('/users')({ page: 1 })('json')
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
