import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'

export type Locale = 'en' | 'ru'

const STORAGE_KEY = 'frontend-study-lab-locale'

function getSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'ru')
      return saved
  } catch { /* ignore */ }
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}

export function toggleLocale(): Locale {
  const next = getLocale() === 'en' ? 'ru' : 'en'
  setLocale(next)
  return next
}

export default i18n
