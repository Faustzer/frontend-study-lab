<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">JavaScript Core</p>
        <span class="difficulty difficulty-easy">Easy • +30 XP</span>
      </div>
      <h2>throttle</h2>
      <p class="demo-copy">
        Техника ограничения вызова функции. throttle гарантирует, что функция
        выполнится не чаще чем 1 раз за выставленный интервал времени.
      </p>

      <label class="field">
        <span>Введите текст</span>
        <input
          v-model="input"
          type="text"
          placeholder="Печатай быстро"
          @input="updateValue(input)"
        >
      </label>

      <div class="stats">
        <div>
          <span class="muted">Текущее значение</span>
          <strong>{{ input || '...' }}</strong>
        </div>
        <div>
          <span class="muted">Throttled value</span>
          <strong>{{ throttled || '...' }}</strong>
        </div>
        <div>
          <span class="muted">Сколько раз сработало</span>
          <strong>{{ updates }}</strong>
        </div>
      </div>

      <pre class="code">throttle(fn, 1000)</pre>

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
import { ref } from 'vue'
import { throttle } from './throttle'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('throttle'))

function onComplete() {
  if (completed.value) return
  progress.completeModule('throttle', 30)
  completed.value = true
}

const input = ref('')
const throttled = ref('')
const updates = ref(0)

const updateValue = throttle((value: string) => {
  throttled.value = value
  updates.value += 1
}, 1000)
</script>

