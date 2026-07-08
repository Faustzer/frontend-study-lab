import { expect, test } from './fixtures'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Frontend Study Lab' }).first()).toBeVisible()
  })

  test('shows stats cards', async ({ page }) => {
    await expect(page.getByRole('complementary').getByText('Level')).toBeVisible()
    await expect(page.getByRole('complementary').getByText('XP')).toBeVisible()
    await expect(page.getByRole('complementary').getByText('Done')).toBeVisible()
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
