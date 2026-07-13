import { expect, test } from './fixtures'

test.describe('Topic page navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  function sidebarModule(page: import('@playwright/test').Page, slug: string) {
    return page.getByRole('complementary').getByRole('link', { name: new RegExp(`^${slug}`, 'i') })
  }

  test('navigates to a topic page', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'bind', exact: true })).toBeVisible()
  })

  test('shows difficulty chip on topic page', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await expect(page.getByRole('main').getByText('Medium', { exact: true })).toBeVisible()
  })

  test('shows XP reward chip on topic page', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await expect(page.getByRole('main').locator('.topic__chip--xp')).toHaveText('+60 XP')
  })

  test('shows complete button', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await expect(page.getByRole('button', { name: /Complete module/ })).toBeVisible()
  })

  test('navigates back to home', async ({ page }) => {
    await sidebarModule(page, 'bind').click()
    await page.getByRole('main').getByRole('link', { name: /Dashboard/ }).click()
    await expect(page.getByRole('heading', { name: 'Frontend Study Lab' }).first()).toBeVisible()
  })

  test('can navigate to multiple topics', async ({ page }) => {
    await sidebarModule(page, 'curry').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'curry', exact: true })).toBeVisible()

    await sidebarModule(page, 'debounce').click()
    await expect(page.getByRole('main').getByRole('heading', { name: 'debounce', exact: true })).toBeVisible()
  })
})
