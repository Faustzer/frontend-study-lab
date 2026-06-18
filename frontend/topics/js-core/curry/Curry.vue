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
        Currying превращает функцию с несколькими аргументами в цепочку функций,
        каждая из которых запоминает часть аргументов и ждёт остальные.
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>До curry</h3>
          <p>Обычная функция получает все аргументы за один вызов:</p>
          <pre>buildUrl('/users', { page: 1 }, 'json')</pre>
        </article>
        <article class="lesson-card">
          <h3>После curry</h3>
          <p>Каррированная функция может получать аргументы по шагам:</p>
          <pre>curriedBuildUrl('/users')({ page: 1 })('json')</pre>
        </article>
      </div>

      <div class="flow">
        <div class="flow-step">
          <span class="step-number">1</span>
          <strong>Передали endpoint</strong>
          <code>'/users'</code>
        </div>
        <div class="flow-step">
          <span class="step-number">2</span>
          <strong>Получили новую функцию</strong>
          <code>(query) => ...</code>
        </div>
        <div class="flow-step">
          <span class="step-number">3</span>
          <strong>Передали query</strong>
          <code>{ page: 1 }</code>
        </div>
        <div class="flow-step">
          <span class="step-number">4</span>
          <strong>Передали format</strong>
          <code>'json'</code>
        </div>
      </div>

      <div class="result-panel">
        <span class="muted">Результат вызова</span>
        <strong>{{ url }}</strong>
      </div>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">✓ Завершено</span>
        <span v-else>Завершить модуль → +60 XP</span>
      </button>
    </div>
  </section>
</template>
<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>

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

