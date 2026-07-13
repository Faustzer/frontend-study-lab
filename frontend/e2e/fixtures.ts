import { test as base, expect } from '@playwright/test'

/**
 * Shared test base:
 * - marks the auth modal as already shown so it does not overlay
 *   the page and block clicks in guest sessions;
 * - pins the daily quest to `debounce` so completing bind/curry in
 *   tests never earns a x2 reward (which would make XP assertions
 *   flaky and could pop the Level-Up modal mid-test).
 * Auth-flow specs that need the modal should import from
 * '@playwright/test' directly.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      localStorage.setItem('frontend-study-lab-auth-modal-shown', '1')

      const pad = (v: number) => String(v).padStart(2, '0')
      const d = new Date()
      const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      const raw = localStorage.getItem('frontend-study-lab-progress')
      const progress = raw ? JSON.parse(raw) : {}
      progress.questSlug = 'debounce'
      progress.questAssignedDate = today
      localStorage.setItem('frontend-study-lab-progress', JSON.stringify(progress))
    })
    await use(context)
  },
})

export { expect }
