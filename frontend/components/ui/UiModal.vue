<template>
  <Teleport to="body">
    <Transition name="ui-modal">
      <div v-if="open" class="ui-modal-overlay" @click="onOverlayClick">
        <div class="ui-modal" :class="`ui-modal--${size}`" role="dialog" aria-modal="true">
          <div class="ui-modal__header">
            <h3 v-if="title" class="ui-modal__title">
              {{ title }}
            </h3>
            <button class="ui-modal__close" aria-label="Close" @click="emit('close')">
              &times;
            </button>
          </div>
          <div class="ui-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
export interface UiModalProps {
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<UiModalProps>(), {
  size: 'md',
})

const emit = defineEmits<{
  close: []
}>()

function onOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.ui-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.ui-modal {
  background: white;
  border-radius: $radius-xl;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &--sm {
    width: 400px;
  }

  &--md {
    width: 520px;
  }

  &--lg {
    width: 680px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-lg $space-xl;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  &__close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    font-size: 24px;
    cursor: pointer;
    color: $color-text-muted;
    border-radius: $radius-sm;

    &:hover {
      background: $color-bg-card;
      color: $color-text;
    }
  }

  &__body {
    padding: $space-xl;
    overflow-y: auto;
    flex: 1;
  }

  &__footer {
    padding: $space-md $space-xl;
    border-top: 1px solid $color-border;
    display: flex;
    justify-content: flex-end;
    gap: $space-sm;
  }
}

.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity 0.2s ease;
}

.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}
</style>
