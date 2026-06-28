<template>
  <TopicPage
    module-slug="bind"
    title="bind"
    :description="$t('modules.bind.description')"
    category-label="JavaScript Core"
    difficulty="medium"
    :xp-reward="60"
  >
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
  </TopicPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { myBind } from './bind'
import TopicPage from '@/components/layout/TopicPage.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'

interface UserContext { name: string }

function sayHello(this: UserContext, greeting: string): string {
  return `${greeting}, ${this.name}`
}

const user: UserContext = { name: 'Ann' }
const boundSayHello = myBind(sayHello, user)
const result = computed(() => boundSayHello('Hello'))

const codeExample = [
  'function sayHello(this: UserContext, greeting: string) {',
  '  return `${greeting}, ${this.name}`', // eslint-disable-line no-template-curly-in-string
  '}',
  '',
  'const bound = myBind(sayHello, { name: "Ann" })',
  'bound("Hello") // → "Hello, Ann"',
].join('\n')
</script>
