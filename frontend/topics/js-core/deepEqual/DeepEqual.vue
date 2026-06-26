<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="medium" :xp="60" />
      </div>
      <h2>deepEqual</h2>
      <p class="demo-copy">
        {{ $t('modules.deepEqual.description') }}
      </p>

      <div class="lesson-grid">
        <article class="lesson-card">
          <h3>{{ $t('modules.deepEqual.leftLabel') }}</h3>
          <CodeBlock language="code">
            {{ leftValue }}
          </CodeBlock>
        </article>
        <article class="lesson-card">
          <h3>{{ $t('modules.deepEqual.rightLabel') }}</h3>
          <CodeBlock language="code">
            {{ rightValue }}
          </CodeBlock>
        </article>
      </div>

      <div class="result-panel">
        <span class="muted">{{ $t('modules.deepEqual.resultLabel') }}</span>
        <strong>{{ result }}</strong>
      </div>

      <CodeBlock language="javascript">
        {{ codeExample }}
      </CodeBlock>

      <CompleteButton module-slug="deepEqual" :xp-reward="60" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { deepEqual } from './deepEqual'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

const left = { user: 'Ann', skills: ['js', 'ts'] }
const right = { user: 'Ann', skills: ['js', 'ts'] }

const leftValue = JSON.stringify(left, null, 2)
const rightValue = JSON.stringify(right, null, 2)
const result = computed(() => deepEqual(left, right))

const codeExample = [
  'const left = { user: "Ann", skills: ["js", "ts"] }',
  'const right = { user: "Ann", skills: ["js", "ts"] }',
  '',
  'deepEqual(left, right) // → true',
  'left === right         // → false',
].join('\n')
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
