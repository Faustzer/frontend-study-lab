<template>
  <div v-if="ui.mobileSidebarOpen" class="overlay" @click="ui.closeMobileSidebar()" />
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>
