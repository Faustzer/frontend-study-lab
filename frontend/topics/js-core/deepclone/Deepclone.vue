<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <span class="difficulty difficulty-medium">Medium • +60 XP</span>
      </div>
      <h2>deepClone</h2>
      <p class="demo-copy">
        Deep clone создаёт новый объект со своими вложенными объектами и массивами.
        Поэтому изменения в copy не протекают обратно в original.
      </p>

      <div class="actions">
        <button type="button" @click="changeCopy">
          Изменить только copy
        </button>
        <button class="secondary" type="button" @click="resetCopy">
          Сбросить copy
        </button>
      </div>

      <div class="comparison">
        <article class="object-card">
          <h3>Original</h3>
          <pre>{{ formatValue(original) }}</pre>
        </article>
        <article class="object-card">
          <h3>Copy</h3>
          <pre>{{ formatValue(copy) }}</pre>
        </article>
      </div>

      <div class="ref-checks">
        <div class="ref-item">
          <span class="muted">original === copy</span>
          <strong>{{ original === copy }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">address same ref</span>
          <strong>{{ original.address === copy.address }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">skills same ref</span>
          <strong>{{ original.skills === copy.skills }}</strong>
        </div>
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
import { deepClone } from './deepclone'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('deepclone'))

function onComplete() {
  if (completed.value)
    return
  progress.completeModule('deepclone', 60)
  completed.value = true
}

const original = {
  name: 'Ann',
  age: 28,
  address: { city: 'Moscow', zip: '123456' },
  skills: ['js', 'ts'],
}

const copy = ref(deepClone(original))

function changeCopy() {
  copy.value.name = 'Changed'
  copy.value.address.city = 'Nowhere'
  copy.value.skills.push('rust')
}

function resetCopy() {
  copy.value = deepClone(original)
}

function formatValue(val: any) {
  return JSON.stringify(val, null, 2)
}
</script>

