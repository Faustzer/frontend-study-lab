<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">JavaScript Core</p>
        <span class="difficulty difficulty-easy">Easy • +30 XP</span>
      </div>
      <h2>debounce</h2>
      <p class="demo-copy">
        Функция откладывает выполнение до тех пор, пока поток вызовов не
        остановится на заданное время.
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
          <span class="muted">Debounced value</span>
          <strong>{{ debouncedValue || '...' }}</strong>
        </div>
        <div>
          <span class="muted">Сколько раз сработало</span>
          <strong>{{ updates }}</strong>
        </div>
      </div>

      <pre class="code">debounce(fn, 500)</pre>

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
import { debounce } from './debounce'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('debounce'))

function onComplete() {
  if (completed.value) return
  progress.completeModule('debounce', 30)
  completed.value = true
}

const input = ref('')
const debouncedValue = ref('')
const updates = ref(0)

const updateValue = debounce((value: string) => {
  debouncedValue.value = value
  updates.value += 1
}, 500)
</script>

