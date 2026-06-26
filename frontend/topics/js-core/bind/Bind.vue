<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="medium" :xp="60" />
      </div>
      <h2>bind</h2>
      <p class="demo-copy">
        {{ $t('modules.bind.description') }}
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>{{ $t('modules.bind.contextLabel') }}</h3>
          <CodeBlock language="code">
            {{ user }}
          </CodeBlock>
        </article>
        <article class="lesson-card">
          <h3>{{ $t('modules.bind.resultLabel') }}</h3>
          <CodeBlock language="code">
            {{ result }}
          </CodeBlock>
        </article>
      </div>

      <CodeBlock language="javascript">
        {{ codeExample }}
      </CodeBlock>

      <CompleteButton module-slug="bind" :xp-reward="60" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { myBind } from './bind'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

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
