<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <span class="difficulty difficulty-medium">Medium • +60 XP</span>
      </div>
      <h2>bind</h2>
      <p class="demo-copy">
        {{ $t('modules.bind.description') }}
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>{{ $t('modules.bind.contextLabel') }}</h3>
          <p>{{ user }}</p>
        </article>
        <article class="lesson-card">
          <h3>{{ $t('modules.bind.resultLabel') }}</h3>
          <p>{{ result }}</p>
        </article>
      </div>

      <pre class="code">{{ codeExample }}</pre>

      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t('modules.bind.completedBtn') }}</span>
        <span v-else>{{ $t('modules.bind.completeBtn', { xp: 60 }) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { myBind } from './bind'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const completed = ref(progress.isModuleCompleted('bind'))

function onComplete() {
  if (completed.value)
    return
  progress.completeModule('bind', 60)
  completed.value = true
}

interface UserContext { name: string }

function sayHello(this: UserContext, greeting: string): string {
  return `${greeting}, ${this.name}`
}

const user: UserContext = { name: 'Ann' }
const boundSayHello = myBind(sayHello, user)
const result = computed(() => boundSayHello('Hello'))

const codeExample = [
  'function sayHello(this: UserContext, greeting: string) {',
  '  return `${greeting}, ${this.name}`',
  '}',
  '',
  'const bound = myBind(sayHello, { name: "Ann" })',
  'bound("Hello") // → "Hello, Ann"',
].join('\n')
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
