import { expect, test } from './fixtures'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Frontend Study Lab' }).first()).toBeVisible()
  })

  test('shows dashboard stat cards', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main.getByText('Level', { exact: true }).first()).toBeVisible()
    await expect(main.getByText('Total XP')).toBeVisible()
    await expect(main.getByText('Modules', { exact: true })).toBeVisible()
    await expect(main.getByText('Day streak')).toBeVisible()
  })

  test('shows player card in sidebar', async ({ page }) => {
    const sidebar = page.getByRole('complementary')
    await expect(sidebar.getByText(/^LV \d+$/)).toBeVisible()
    await expect(sidebar.getByText(/\d+ \/ \d+ XP/)).toBeVisible()
  })

  test('shows daily quest banner', async ({ page }) => {
    await expect(page.getByText('Daily quest')).toBeVisible()
    await expect(page.getByText(/Complete “Debounce” — double XP/)).toBeVisible()
  })

  test('displays XP progress bar', async ({ page }) => {
    await expect(page.getByText('XP to next level')).toBeVisible()
  })

  test('shows categories section', async ({ page }) => {
    await expect(page.getByRole('link', { name: /JavaScript Core/ })).toBeVisible()
  })

  test('displays language switcher', async ({ page }) => {
    await expect(page.getByRole('button', { name: '🌐 EN' })).toBeVisible()
  })
})
