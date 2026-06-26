<template>
  <div class="code-block" :class="`code-block--${language}`">
    <pre class="code-block__pre"><code class="code-block__code"><slot /></code></pre>
  </div>
</template>

<script setup lang="ts">
export interface CodeBlockProps {
  language?: 'typescript' | 'javascript' | 'ts' | 'js' | 'json' | 'html' | 'css' | 'plaintext' | 'code'
}

withDefaults(defineProps<CodeBlockProps>(), {
  language: 'plaintext',
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.code-block {
  margin-top: $space-md;
  background: rgba(28, 31, 22, 0.04);
  border: 1px solid rgba(28, 31, 22, 0.08);
  border-radius: $radius-md;
  overflow: hidden;

  &:first-child {
    margin-top: 0;
  }

  &__pre {
    margin: 0;
    padding: $space-md;
    overflow-x: auto;
    word-break: break-word;
    white-space: pre-wrap;
    max-width: 100%;
    box-sizing: border-box;
  }

  &__code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: $color-text;
  }

  // Language-specific colors (subtle left border accent)
  &--typescript,
  &--ts {
    border-left: 3px solid #3178c6;
  }

  &--javascript,
  &--js {
    border-left: 3px solid #f7df1e;
  }

  &--json {
    border-left: 3px solid #4caf50;
  }

  &--html {
    border-left: 3px solid #e34c26;
  }

  &--css {
    border-left: 3px solid #264de4;
  }

  &--plaintext {
    border-left: 3px solid $color-border;
  }

  &--code {
    border-left: none;
  }
}
</style>
