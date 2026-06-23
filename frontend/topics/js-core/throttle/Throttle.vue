<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <span class="difficulty difficulty-easy">Easy • +30 XP</span>
      </div>
      <h2>throttle</h2>
      <p class="demo-copy">
        {{ $t('modules.throttle.description') }}
      </p>

      <label class="field">
        <span>{{ $t('modules.throttle.inputLabel') }}</span>
        <input
          v-model="input"
          type="text"
          :placeholder="$t('modules.throttle.inputPlaceholder')"
          @input="updateValue(input)"
        >
      </label>

      <div class="stats">
        <div>
          <span class="muted">{{ $t('modules.throttle.currentValue') }}</span>
          <strong>{{ input || '...' }}</strong>
        </div>
        <div>
          <span class="muted">{{ $t('modules.throttle.throttledValue') }}</span>
          <strong>{{ throttled || '...' }}</strong>
        </div>
        <div>
          <span class="muted">{{ $t('modules.throttle.callCount') }}</span>
          <strong>{{ updates }}</strong>
        </div>
      </div>

      <pre class="code">throttle(fn, 1000)</pre>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('modules.throttle.completedBtn') }}</span>
        <span v-else>{{ $t('modules.throttle.completeBtn', { xp: 30 }) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { throttle } from './throttle'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('throttle'))

function onComplete() {
  if (completed.value)
    return
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

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
