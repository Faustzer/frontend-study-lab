<template>
  <div class="player-card">
    <div class="player-card__floats" aria-hidden="true">
      <span v-for="f in celebration.state.floats" :key="f.id" class="player-card__float">
        {{ f.label }}
      </span>
    </div>

    <div class="player-card__top">
      <div class="player-card__ring">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="27" fill="none" class="player-card__ring-track" />
          <circle
            cx="32" cy="32" r="27" fill="none"
            transform="rotate(-90 32 32)"
            class="player-card__ring-arc"
            :style="{ strokeDashoffset: ringOffset }"
          />
        </svg>
        <img v-if="auth.userAvatar" :src="auth.userAvatar" :alt="playerName" class="player-card__avatar-img">
        <span v-else class="player-card__avatar">🧑‍💻</span>
      </div>
      <div class="player-card__id">
        <div class="player-card__name-row">
          <strong class="player-card__name">{{ playerName }}</strong>
          <span class="player-card__lv">LV {{ level }}</span>
        </div>
        <div class="player-card__streak">
          <span>🔥</span>
          <span>{{ t('streak.days', { n: streak }) }}</span>
        </div>
      </div>
    </div>

    <div class="player-card__xp">
      <div class="player-card__bar">
        <div class="player-card__fill" :style="{ width: `${xpPercent}%` }" />
      </div>
      <div class="player-card__meta">
        <span>{{ xp }} / {{ xpToNext }} XP</span>
        <span>{{ t('player.toNext', { level: level + 1, left: xpLeft }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCelebration } from '@/composables/useCelebration'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

// Длина окружности кольца r=27: 2π·27 ≈ 169.6
const RING_CIRCUMFERENCE = 169.6

const { t } = useI18n()
const auth = useAuthStore()
const progress = useProgressStore()
const celebration = useCelebration()

const level = computed(() => progress.level)
const xp = computed(() => progress.totalXp)
const xpToNext = computed(() => progress.xpToNext)
const xpPercent = computed(() => progress.xpPercent)
const xpLeft = computed(() => Math.max(0, xpToNext.value - xp.value))
const streak = computed(() => progress.streak)

const playerName = computed(() =>
  auth.isAuthenticated ? auth.userDisplayName : t('player.guest'),
)

const ringOffset = computed(() =>
  (RING_CIRCUMFERENCE * (1 - xpPercent.value / 100)).toFixed(1),
)
</script>

<style lang="scss" scoped>
.player-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card);
  box-shadow: 0 2px 0 rgba(28, 31, 22, 0.05);

  &__floats {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 5;
    pointer-events: none;
  }

  &__float {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    text-shadow: 0 1px 0 var(--card);
    animation: riseFade 1.4s ease-out forwards;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__ring {
    position: relative;
    width: 64px;
    height: 64px;
    flex: none;
  }

  &__ring-track {
    stroke: var(--track);
    stroke-width: 5;
  }

  &__ring-arc {
    stroke: var(--accent);
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 169.6;
    transition: stroke-dashoffset 0.7s cubic-bezier(0.3, 1, 0.4, 1);
  }

  &__avatar,
  &__avatar-img {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  &__avatar-img {
    width: 40px;
    height: 40px;
    margin: auto;
    border-radius: 50%;
    object-fit: cover;
  }

  &__id {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__lv {
    flex: none;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
  }

  &__streak {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--muted);
  }

  &__xp {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__bar {
    height: 8px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--gold));
    transition: width 0.7s cubic-bezier(0.3, 1, 0.4, 1);
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--faint);
  }
}
</style>
