<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="easy" :xp="30" />
      </div>
      <h2>debounce</h2>
      <p class="demo-copy">
        {{ $t('modules.debounce.description') }}
      </p>

      <label class="field">
        <span>{{ $t('modules.debounce.inputLabel') }}</span>
        <input
          v-model="input"
          type="text"
          :placeholder="$t('modules.debounce.inputPlaceholder')"
          @input="updateValue(input)"
        >
      </label>

      <div class="stats">
        <div>
          <span class="muted">{{ $t('modules.debounce.currentValue') }}</span>
          <strong>{{ input || '...' }}</strong>
        </div>
        <div>
          <span class="muted">{{ $t('modules.debounce.debouncedValue') }}</span>
          <strong>{{ debouncedValue || '...' }}</strong>
        </div>
        <div>
          <span class="muted">{{ $t('modules.debounce.callCount') }}</span>
          <strong>{{ updates }}</strong>
        </div>
      </div>

      <CodeBlock language="javascript">
        debounce(fn, 500)
      </CodeBlock>

      <CompleteButton module-slug="debounce" :xp-reward="30" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from './debounce'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

const input = ref('')
const debouncedValue = ref('')
const updates = ref(0)

const updateValue = debounce((value: string) => {
  debouncedValue.value = value
  updates.value += 1
}, 500)
</script>

<style lang="scss">
@use '@/assets/scss/pages/topic' as *;
</style>
