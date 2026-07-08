import { test as base, expect } from '@playwright/test'

/**
 * Shared test base: marks the auth modal as already shown so it
 * does not overlay the page and block clicks in guest sessions.
 * Auth-flow specs that need the modal should import from
 * '@playwright/test' directly.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      localStorage.setItem('frontend-study-lab-auth-modal-shown', '1')
    })
    await use(context)
  },
})

export { expect }
