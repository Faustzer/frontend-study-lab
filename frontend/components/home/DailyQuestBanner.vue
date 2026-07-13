<template>
  <section v-if="questModule && !questDone" class="quest quest--pending">
    <div class="quest__tile">
      ⚡
    </div>
    <div class="quest__body">
      <div class="quest__head">
        <span class="quest__overline">{{ t('quest.label') }}</span>
        <span class="quest__countdown">⏳ {{ countdown }}</span>
      </div>
      <strong class="quest__title">{{ t('quest.title', { module: questModule.title }) }}</strong>
      <span class="quest__reward">
        {{ questModule.xpReward }} XP × 2 = <strong>{{ questModule.xpReward * 2 }} XP</strong>
      </span>
    </div>
    <UiButton variant="tactile" size="sm" class="quest__cta" @click="openQuest">
      {{ t('quest.take') }}
    </UiButton>
  </section>

  <section v-else-if="questModule && questDone" class="quest quest--done">
    <div class="quest__tile quest__tile--done">
      🏆
    </div>
    <div class="quest__body">
      <strong class="quest__done-title">{{ t('quest.doneTitle', { xp: questModule.xpReward * 2 }) }}</strong>
      <span class="quest__done-hint">{{ t('quest.doneHint') }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/UiButton.vue'
import { useTopics } from '@/composables/useTopics'
import { useProgressStore } from '@/stores/progress'

const { t } = useI18n()
const router = useRouter()
const { allModules } = useTopics()
const progress = useProgressStore()

const questModule = computed(() =>
  allModules.value.find(m => m.slug === progress.questSlug) ?? null,
)
const questDone = computed(() => progress.questCompletedToday)

// Обратный отсчёт до полуночи
const countdown = ref('—:—:—')
let interval: ReturnType<typeof setInterval> | undefined

function updateCountdown() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const s = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
  const p = (v: number) => String(v).padStart(2, '0')
  countdown.value = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`
}

onMounted(() => {
  updateCountdown()
  interval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => clearInterval(interval))

function openQuest() {
  if (questModule.value)
    router.push(`/${questModule.value.category}/${questModule.value.slug}`)
}
</script>

<style lang="scss" scoped>
.quest {
  position: relative;
  overflow: hidden;
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 20px;

  &--pending {
    border: 1px solid var(--accent-line);
    background: linear-gradient(
      120deg,
      color-mix(in srgb, var(--accent) 9%, var(--card)),
      color-mix(in srgb, #e0a318 13%, var(--card))
    );
  }

  &--done {
    gap: 14px;
    border: 1px solid color-mix(in srgb, var(--green) 35%, transparent);
    background: color-mix(in srgb, var(--green) 9%, var(--card));
  }

  &__tile {
    width: 46px;
    height: 46px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--gold) 22%, transparent);

    &--done {
      font-size: 22px;
      background: color-mix(in srgb, var(--green) 18%, transparent);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__overline {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
  }

  &__countdown {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ink) 8%, transparent);
    color: var(--muted);
  }

  &__title {
    font-size: 14.5px;
  }

  &__reward {
    font-size: 11.5px;
    color: var(--muted);

    strong {
      color: var(--accent);
    }
  }

  &__cta {
    flex: none;
  }

  &__done-title {
    font-size: 14px;
    color: var(--green);
  }

  &__done-hint {
    font-size: 11.5px;
    color: var(--muted);
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;

    &__cta {
      width: 100%;
    }
  }
}
</style>
