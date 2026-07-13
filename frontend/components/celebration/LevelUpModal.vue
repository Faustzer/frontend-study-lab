<template>
  <div
    v-if="levelUp"
    class="level-up"
    role="dialog"
    aria-modal="true"
    :aria-label="t('levelUp.title')"
    @click.self="celebration.closeLevelUp()"
  >
    <div class="level-up__card">
      <div class="level-up__ring">
        🎉
      </div>
      <span class="level-up__overline">{{ t('levelUp.title') }}</span>
      <strong class="level-up__level">{{ t('common.level') }} {{ levelUp.level }}</strong>
      <span class="level-up__hint">{{ t('levelUp.next', { xp: levelUp.xpToNext }) }}</span>
      <UiButton variant="tactile" class="level-up__btn" @click="celebration.closeLevelUp()">
        {{ t('levelUp.continue') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/UiButton.vue'
import { useCelebration } from '@/composables/useCelebration'

const { t } = useI18n()
const celebration = useCelebration()
const levelUp = computed(() => celebration.state.levelUp)
</script>

<style lang="scss" scoped>
.level-up {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(28, 25, 16, 0.45);
  backdrop-filter: blur(5px);
  animation: fadeUp 0.25s ease;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 36px 48px;
    border-radius: 26px;
    background: var(--card);
    border: 1px solid var(--line);
    box-shadow: 0 30px 80px rgba(28, 25, 16, 0.35);
    animation: popIn 0.45s cubic-bezier(0.5, 1.6, 0.4, 1);
  }

  &__ring {
    width: 88px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 4px solid var(--accent);
    background: var(--accent-soft);
    font-size: 38px;
    animation: ringPop 0.6s cubic-bezier(0.5, 1.6, 0.4, 1);
  }

  &__overline {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--accent);
  }

  &__level {
    font-size: 30px;
    letter-spacing: -0.02em;
  }

  &__hint {
    font-size: 12px;
    color: var(--muted);
  }

  &__btn {
    margin-top: 6px;
  }
}
</style>
