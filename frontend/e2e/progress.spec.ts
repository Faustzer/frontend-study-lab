import { expect, test } from './fixtures'

test.describe('Progress flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('completes a module and updates progress', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    // Button should show completed state
    await expect(page.getByRole('button', { name: /Completed/ })).toBeVisible()
  })

  test('completed module shows checkmark in sidebar', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.getByText('Dashboard').click()
    // The sidebar should show a checkmark for completed module
    await expect(page.locator('.check').first()).toBeVisible()
  })

  test('XP increases after completing module', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    // Navigate back and check XP increased
    await page.getByText('Dashboard').click()
    await expect(page.getByRole('complementary').locator('.stat-value').nth(1)).toHaveText('60')
  })

  test('progress persists after reload', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.reload()
    // After reload we are still on the bind page; re-click via the sidebar
    // link specifically — plain getByText('bind') also matches the page
    // title and code examples once the topic content renders
    await page.getByRole('link', { name: /^Bind/ }).click()

    // Should still show as completed
    await expect(page.getByRole('button', { name: /Completed/ })).toBeVisible()
  })

  test('can complete multiple modules', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await page.getByText('Dashboard').click()
    await page.getByText('curry').click()
    await page.getByRole('button', { name: /Complete module/ }).click()

    await expect(page.getByRole('button', { name: /Completed/ })).toBeVisible()
  })
})
