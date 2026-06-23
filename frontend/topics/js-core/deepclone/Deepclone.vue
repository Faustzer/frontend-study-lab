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
        {{ $t('modules.deepClone.description') }}
      </p>

      <div class="actions">
        <button type="button" @click="changeCopy">
          {{ $t('modules.deepClone.changeBtn') }}
        </button>
        <button class="secondary" type="button" @click="resetCopy">
          {{ $t('modules.deepClone.resetBtn') }}
        </button>
      </div>

      <div class="comparison">
        <article class="object-card">
          <h3>{{ $t('modules.deepClone.originalLabel') }}</h3>
          <pre>{{ formatValue(original) }}</pre>
        </article>
        <article class="object-card">
          <h3>{{ $t('modules.deepClone.copyLabel') }}</h3>
          <pre>{{ formatValue(copy) }}</pre>
        </article>
      </div>

      <div class="ref-checks">
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepClone.refCheckSame') }}</span>
          <strong>{{ original === copy }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepClone.refCheckAddress') }}</span>
          <strong>{{ original.address === copy.address }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepClone.refCheckSkills') }}</span>
          <strong>{{ original.skills === copy.skills }}</strong>
        </div>
      </div>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('modules.deepClone.completedBtn') }}</span>
        <span v-else>{{ $t('modules.deepClone.completeBtn', { xp: 60 }) }}</span>
      </button>
    </div>
  </section>
</template>

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

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
