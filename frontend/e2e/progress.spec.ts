import { expect, test } from './fixtures'

test.describe('Progress flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage for clean state (the init script re-seeds on reload)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  function sidebarModule(page: import('@playwright/test').Page, slug: string) {
    return page.getByRole('complementary').getByRole('link', { name: new RegExp(`^${slug}`, 'i') })
  }

  test('completes a module and updates progress', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    // The completed badge replaces the button
    await expect(page.getByText('✓ Completed')).toBeVisible()
  })

  test('completed module shows checkmark in sidebar', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.getByRole('complementary').getByRole('link', { name: /Dashboard/ }).click()
    await expect(page.locator('.sidebar__module-check').first()).toBeVisible()
  })

  test('XP increases after completing module', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    // bind is worth 60 XP; the player card shows the running total
    await expect(page.getByRole('complementary').getByText('60 / 100 XP')).toBeVisible()
  })

  test('progress persists after reload', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.reload()
    // After reload we are still on the bind page
    await expect(page.getByText('✓ Completed')).toBeVisible()
  })

  test('can complete multiple modules', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.getByRole('complementary').getByRole('link', { name: /Dashboard/ }).click()
    await sidebarModule(page, 'curry').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await expect(page.getByText('✓ Completed')).toBeVisible()
  })
})
