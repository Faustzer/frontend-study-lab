<template>
  <button class="lang-switcher" @click="toggle">
    <span class="lang-icon">🌐</span>
    <span class="lang-code">{{ locale.toUpperCase() }}</span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toggleLocale } from '@/i18n'

const { locale } = useI18n()

function toggle() {
  toggleLocale()
}
</script>

<style lang="scss">
@use '@/assets/scss/components/language-switcher' as *;
</style>
