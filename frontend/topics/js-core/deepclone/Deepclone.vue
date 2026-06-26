<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">
          JavaScript Core
        </p>
        <UiBadge difficulty="medium" :xp="60" />
      </div>
      <h2>deepClone</h2>
      <p class="demo-copy">
        {{ $t('modules.deepclone.description') }}
      </p>

      <div class="actions">
        <button type="button" @click="changeCopy">
          {{ $t('modules.deepclone.changeBtn') }}
        </button>
        <button class="secondary" type="button" @click="resetCopy">
          {{ $t('modules.deepclone.resetBtn') }}
        </button>
      </div>

      <div class="comparison">
        <article class="object-card">
          <h3>{{ $t('modules.deepclone.originalLabel') }}</h3>
          <CodeBlock language="code">
            {{ formatValue(original) }}
          </CodeBlock>
        </article>
        <article class="object-card">
          <h3>{{ $t('modules.deepclone.copyLabel') }}</h3>
          <CodeBlock language="code">
            {{ formatValue(copy) }}
          </CodeBlock>
        </article>
      </div>

      <div class="ref-checks">
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepclone.refCheckSame') }}</span>
          <strong>{{ original === copy }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepclone.refCheckAddress') }}</span>
          <strong>{{ original.address === copy.address }}</strong>
        </div>
        <div class="ref-item">
          <span class="muted">{{ $t('modules.deepclone.refCheckSkills') }}</span>
          <strong>{{ original.skills === copy.skills }}</strong>
        </div>
      </div>

      <CompleteButton module-slug="deepclone" :xp-reward="60" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { deepClone } from './deepclone'
import CompleteButton from '@/components/topic/CompleteButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import CodeBlock from '@/components/ui/CodeBlock.vue'

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
