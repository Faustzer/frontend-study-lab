<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="easy" :xp="30" />
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

      <CodeBlock language="javascript">
        throttle(fn, 1000)
      </CodeBlock>

      <CompleteButton module-slug="throttle" :xp-reward="30" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { throttle } from './throttle'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

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
