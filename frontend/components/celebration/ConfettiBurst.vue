<template>
  <div v-if="celebration.state.bursts.length" class="confetti" aria-hidden="true">
    <template v-for="burst in celebration.state.bursts" :key="burst.id">
      <span
        v-for="p in burst.parts"
        :key="`${burst.id}-${p.id}`"
        class="confetti__particle"
        :style="{
          'left': `${p.x}px`,
          'top': `${p.y}px`,
          'width': `${p.width}px`,
          'height': `${p.height}px`,
          'background': p.color,
          'borderRadius': p.radius,
          '--dx': p.dx,
          '--dy': p.dy,
          '--up': p.up,
          '--rot': p.rot,
          'animation': `confettiFly ${p.duration}ms cubic-bezier(0.2, 0.6, 0.3, 1) forwards`,
        }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useCelebration } from '@/composables/useCelebration'

const celebration = useCelebration()
</script>

<style lang="scss" scoped>
.confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 400;
  overflow: hidden;

  &__particle {
    position: absolute;
  }
}
</style>
