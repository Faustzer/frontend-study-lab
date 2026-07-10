<template>
  <section class="page-skeleton" role="status" :aria-label="t('common.loading')">
    <div class="page-skeleton__card">
      <UiSkeleton width="120px" height="28px" />
      <UiSkeleton width="60%" height="44px" />
      <UiSkeleton width="90%" />
      <UiSkeleton width="75%" />
      <div class="page-skeleton__grid">
        <UiSkeleton variant="rect" height="140px" />
        <UiSkeleton variant="rect" height="140px" />
      </div>
      <UiSkeleton width="180px" height="42px" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiSkeleton from '@/components/ui/UiSkeleton.vue'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;
@use '@/assets/scss/mixins' as *;

.page-skeleton {
  display: flex;
  justify-content: center;
}

.page-skeleton__card {
  width: min(100%, 720px);
  padding: 28px;
  border-radius: $radius-xl;
  background: $color-bg-card;
  border: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @include mobile {
    padding: 20px;
  }
}

.page-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}
</style>
