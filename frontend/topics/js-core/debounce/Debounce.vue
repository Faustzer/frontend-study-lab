<template>
  <TopicPage
    module-slug="debounce"
    title="debounce"
    :description="$t('modules.debounce.description')"
    category-label="JS Core"
    difficulty="easy"
    :xp-reward="30"
  >
    <label class="ddemo__field">
      <span class="ddemo__field-label">{{ $t('modules.debounce.inputLabel') }}</span>
      <input
        class="ddemo__input"
        type="text"
        :placeholder="$t('modules.debounce.inputPlaceholder')"
        :value="typed"
        @input="onType"
      >
    </label>

    <!-- Окно тишины: бар перезапускается на каждый ввод (key-перемонтирование) -->
    <div class="ddemo__block">
      <div class="ddemo__block-head">
        <span>{{ $t('demo.silenceWindow') }}</span>
        <span class="ddemo__status" :class="`ddemo__status--${status}`">{{ $t(`demo.status.${status}`) }}</span>
      </div>
      <div class="ddemo__timer-track">
        <div v-if="timerActive" :key="timerKey" class="ddemo__timer-fill" />
      </div>
    </div>

    <!-- Поток событий -->
    <div class="ddemo__block">
      <div class="ddemo__block-head ddemo__block-head--baseline">
        <span>{{ $t('demo.eventStream') }}</span>
        <span class="ddemo__legend">
          ● {{ $t('demo.keyPress') }} · <span class="ddemo__legend-accent">●</span> {{ $t('demo.fnCall') }}
        </span>
      </div>
      <div class="ddemo__events">
        <span
          v-for="ev in events" :key="ev.id"
          class="ddemo__dot" :class="{ 'ddemo__dot--commit': ev.kind === 'commit' }"
        />
      </div>
    </div>

    <div class="ddemo__tiles">
      <div class="ddemo__tile">
        <span class="ddemo__tile-label">{{ $t('modules.debounce.currentValue') }}</span>
        <strong class="ddemo__tile-value">{{ typed || '…' }}</strong>
      </div>
      <div class="ddemo__tile ddemo__tile--accent">
        <span class="ddemo__tile-label ddemo__tile-label--accent">{{ $t('modules.debounce.debouncedValue') }}</span>
        <strong class="ddemo__tile-value">{{ debounced || '…' }}</strong>
      </div>
      <div class="ddemo__tile">
        <span class="ddemo__tile-label">{{ $t('modules.debounce.callCount') }}</span>
        <strong class="ddemo__tile-value">{{ calls }}</strong>
      </div>
    </div>
  </TopicPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { debounce } from './debounce'
import TopicPage from '@/components/layout/TopicPage.vue'

const DELAY = 500
const MAX_EVENTS = 26

const typed = ref('')
const debounced = ref('')
const calls = ref(0)
const events = ref<{ id: number, kind: 'key' | 'commit' }[]>([])
const timerActive = ref(false)
const timerKey = ref(0)
let eventId = 0

function pushEvent(kind: 'key' | 'commit') {
  events.value = [...events.value, { id: ++eventId, kind }].slice(-MAX_EVENTS)
}

const commit = debounce((value: string) => {
  debounced.value = value
  calls.value += 1
  timerActive.value = false
  pushEvent('commit')
}, DELAY)

function onType(e: Event) {
  typed.value = (e.target as HTMLInputElement).value
  pushEvent('key')
  timerActive.value = true
  timerKey.value += 1
  commit(typed.value)
}

const status = computed(() => {
  if (timerActive.value)
    return 'waiting'
  return calls.value > 0 ? 'called' : 'idle'
})
</script>

<style lang="scss" scoped>
.ddemo__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ddemo__field-label {
  font-size: 12px;
  color: var(--muted);
}

.ddemo__input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  border: 1.5px solid var(--input-border);
  border-radius: 14px;
  background: var(--input-bg);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft);
  }
}

.ddemo__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ddemo__block-head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--faint);

  &--baseline {
    align-items: baseline;
    text-transform: none;

    > span:first-child {
      text-transform: uppercase;
    }
  }
}

.ddemo__status {
  &--waiting {
    color: var(--accent);
  }

  &--called {
    color: var(--green);
  }

  &--idle {
    color: var(--faint);
  }
}

.ddemo__timer-track {
  height: 6px;
  border-radius: 999px;
  background: var(--track);
  overflow: hidden;
}

.ddemo__timer-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--gold));
  animation: timerFill 500ms linear forwards;
}

.ddemo__legend {
  font-size: 9.5px;
  color: var(--faint);
  text-transform: none;
  letter-spacing: normal;
}

.ddemo__legend-accent {
  color: var(--accent);
}

.ddemo__events {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  min-height: 20px;
  overflow: hidden;
  padding: 2px 4px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--ink) 3%, transparent);
}

.ddemo__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #cdc3ab;
  animation: popIn 0.3s cubic-bezier(0.5, 1.6, 0.4, 1);

  &--commit {
    width: 13px;
    height: 13px;
    background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
}

.ddemo__tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.ddemo__tile {
  padding: 12px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--ink) 3%, transparent);
  border: 1px solid var(--line);
  min-width: 0;

  &--accent {
    background: var(--accent-soft);
    border-color: var(--accent-line);
  }
}

.ddemo__tile-label {
  display: block;
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--faint);
  margin-bottom: 4px;

  &--accent {
    color: var(--accent);
  }
}

.ddemo__tile-value {
  font-size: 14px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
