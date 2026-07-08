import { expect, test } from './fixtures'

test.describe('Language switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('defaults to English', async ({ page }) => {
    const langButton = page.locator('.lang-switcher')
    await expect(langButton).toBeVisible()
    await expect(langButton).toContainText('EN')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('switches to Russian', async ({ page }) => {
    await page.locator('.lang-switcher').click()
    await expect(page.locator('.lang-switcher')).toContainText('RU')
    await expect(page.getByText('Главная')).toBeVisible()
  })

  test('switches back to English', async ({ page }) => {
    await page.locator('.lang-switcher').click()
    await expect(page.locator('.lang-switcher')).toContainText('RU')

    await page.locator('.lang-switcher').click()
    await expect(page.locator('.lang-switcher')).toContainText('EN')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('language persists after reload', async ({ page }) => {
    await page.locator('.lang-switcher').click()
    await expect(page.locator('.lang-switcher')).toContainText('RU')

    await page.reload()
    await expect(page.locator('.lang-switcher')).toContainText('RU')
  })

  test('topic page also switches language', async ({ page }) => {
    await page.getByText('bind').click()
    await page.locator('.lang-switcher').click()

    await expect(page.locator('.lang-switcher')).toContainText('RU')
  })
})
