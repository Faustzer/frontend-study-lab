<template>
  <Icon
    :icon="iconMap[name] || `logos:${name}`"
    :width="sizes[size]"
    :height="sizes[size]"
    class="ui-icon"
    :class="`ui-icon--${size}`"
  />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

export interface UiIconProps {
  name: 'javascript' | 'typescript' | 'vue' | 'nuxt' | 'css' | 'scss' | 'html' | 'dom' | 'async' | 'react' | 'svelte'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<UiIconProps>(), {
  size: 'md',
})

// Iconify icon names from logos collection
const iconMap: Record<string, string> = {
  javascript: 'logos:javascript',
  typescript: 'logos:typescript',
  vue: 'logos:vue',
  nuxt: 'logos:nuxt-icon',
  css: 'logos:css-3',
  scss: 'logos:sass',
  html: 'logos:html-5',
  dom: 'logos:javascript',
  async: 'logos:javascript',
  react: 'logos:react',
  svelte: 'logos:svelte-icon',
}

const sizes = {
  sm: 16,
  md: 24,
  lg: 32,
}
</script>

<style lang="scss" scoped>
.ui-icon {
  display: inline-flex;
  flex-shrink: 0;

  &--sm {
    width: 16px;
    height: 16px;
  }

  &--md {
    width: 24px;
    height: 24px;
  }

  &--lg {
    width: 32px;
    height: 32px;
  }
}
</style>
