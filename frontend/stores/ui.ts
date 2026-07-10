import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const SIDEBAR_KEY = 'frontend-study-lab-collapsed'
const THEME_KEY = 'frontend-study-lab-theme'
const AUTH_MODAL_KEY = 'frontend-study-lab-auth-modal-shown'

export type Theme = 'light' | 'dark'

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(SIDEBAR_KEY)
    if (raw)
      return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark')
      return saved
  } catch { /* ignore */ }
  return 'light'
}

export const useUiStore = defineStore('ui', () => {
  const collapsedCategories = ref<Set<string>>(loadCollapsed())
  const mobileSidebarOpen = ref(false)
  const theme = ref<Theme>(loadTheme())
  const authModalOpen = ref(false)
  const routeLoading = ref(false)

  // Persist collapsed categories
  watch(collapsedCategories, (val) => {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify([...val]))
  }, { deep: true })

  // Persist theme
  watch(theme, (val) => {
    localStorage.setItem(THEME_KEY, val)
  })

  const sidebarCollapsed = computed(() => collapsedCategories.value)

  function toggleCategory(slug: string) {
    if (collapsedCategories.value.has(slug)) {
      collapsedCategories.value.delete(slug)
    } else {
      collapsedCategories.value.add(slug)
    }
  }

  function isCategoryCollapsed(slug: string): boolean {
    return collapsedCategories.value.has(slug)
  }

  function openMobileSidebar() {
    mobileSidebarOpen.value = true
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function openAuthModal() {
    authModalOpen.value = true
  }

  function closeAuthModal() {
    authModalOpen.value = false
    try {
      localStorage.setItem(AUTH_MODAL_KEY, '1')
    } catch { /* ignore */ }
  }

  function setRouteLoading(value: boolean) {
    routeLoading.value = value
  }

  function shouldShowAuthModal(): boolean {
    try {
      return localStorage.getItem(AUTH_MODAL_KEY) !== '1'
    } catch { /* ignore */ }
    return true
  }

  return {
    collapsedCategories,
    mobileSidebarOpen,
    theme,
    authModalOpen,
    routeLoading,
    sidebarCollapsed,
    setRouteLoading,
    toggleCategory,
    isCategoryCollapsed,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
    setTheme,
    toggleTheme,
    openAuthModal,
    closeAuthModal,
    shouldShowAuthModal,
  }
})
