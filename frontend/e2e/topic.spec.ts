import { expect, test } from './fixtures'

test.describe('Topic page navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigates to a topic page', async ({ page }) => {
    await page.getByText('bind').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'bind', exact: true })).toBeVisible()
  })

  test('shows difficulty badge on topic page', async ({ page }) => {
    await page.getByText('bind').click()
    await expect(page.getByRole('main').locator('.ui-badge')).toBeVisible()
  })

  test('shows XP reward on topic page', async ({ page }) => {
    await page.getByText('bind').click()
    await expect(page.getByRole('main').locator('.ui-badge')).toContainText('+60')
  })

  test('shows complete button', async ({ page }) => {
    await page.getByText('bind').click()
    await expect(page.getByRole('button', { name: /Complete module/ })).toBeVisible()
  })

  test('navigates back to home', async ({ page }) => {
    await page.getByText('bind').click()
    await page.getByText('Dashboard').click()
    await expect(page.getByRole('heading', { name: 'Frontend Study Lab' }).first()).toBeVisible()
  })

  test('can navigate to multiple topics', async ({ page }) => {
    await page.getByText('curry').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'curry', exact: true })).toBeVisible()

    await page.getByText('Dashboard').click()
    await page.getByText('debounce').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'debounce', exact: true })).toBeVisible()
  })
})
