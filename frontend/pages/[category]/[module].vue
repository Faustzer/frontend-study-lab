<template>
  <component :is="topicComponent" v-if="topicComponent" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useTopics } from '@/composables/useTopics'

const route = useRoute()
const { categories } = useTopics()

const topic = computed(() => {
  const category = categories.value.find(c => c.slug === route.params.category)
  return category?.items.find(i => i.slug === route.params.module)
})

if (!topic.value) {
  throw createError({ statusCode: 404, statusMessage: 'Topic not found', fatal: true })
}

const topicComponent = computed(() =>
  topic.value ? defineAsyncComponent(topic.value.component) : null,
)
</script>
