import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Representative public pages + every console route pattern (demo mode).
const PAGES = ['/', '/product', '/product/how-it-works', '/connectors', '/connectors/deepl', '/connectors/openai', '/agents', '/security',
  '/security/kill-controls', '/enterprise', '/enterprise/contact', '/contact', '/pricing', '/developers', '/developers/status', '/developers/api',
  '/receipts', '/signin', '/about', '/privacy', '/does-not-exist',
  '/app', '/app/connectors', '/app/connectors/deepl', '/app/connections', '/app/connections/new', '/app/connections/cn_01HZX3A1', '/app/tools',
  '/app/agents', '/app/agents/runs/run_01J0AA11', '/app/policies', '/app/policies/pol_fin_refunds', '/app/approvals', '/app/approvals/ap_01J1K71',
  '/app/executions', '/app/executions/ex_01J2P88', '/app/receipts', '/app/receipts/rc_01J2Q24', '/app/events', '/app/security', '/app/environments',
  '/app/developer', '/app/usage', '/app/team', '/app/audit', '/app/settings']

test('axe: no WCAG 2.1 A/AA violations', async ({ page }) => {
  test.setTimeout(600_000)
  const found: string[] = []
  for (const p of PAGES) {
    await page.goto(p)
    await page.locator('main').first().waitFor()
    // check the settled page: scroll-reveal fades are decorative (reduced motion shows the final state at once)
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('revealed')))
    await page.waitForTimeout(700)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    for (const v of r.violations) found.push(`${p} ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0].html.slice(0, 100)}`)
  }
  expect(found).toEqual([])
})

test.describe('mega menu', () => {
  test('keyboard: ArrowDown opens and focuses, arrows move, Escape closes and returns focus', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Connectors' })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    const menu = page.getByRole('menu', { name: 'Connectors menu' })
    await expect(menu).toBeVisible()
    const items = menu.getByRole('menuitem')
    await expect(items.first()).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await expect(items.last()).toBeFocused() // wraps
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('Tab out and outside click close the menu; focus is visible', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Product' })
    await trigger.focus()
    const outline = await trigger.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menu', { name: 'Product menu' })).toBeVisible()
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
    await expect(page.getByRole('menu', { name: 'Product menu' })).toBeHidden()
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await page.mouse.click(5, 500)
    await expect(page.getByRole('menu', { name: 'Product menu' })).toBeHidden()
  })

  for (const width of [1024, 1280, 1440]) {
    test(`every panel stays inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const nav = page.getByRole('navigation', { name: 'Primary' })
      for (const item of ['Product', 'Connectors', 'Agents', 'Security', 'Enterprise', 'Developers']) {
        await nav.getByRole('button', { name: item }).hover()
        const menu = page.getByRole('menu', { name: `${item} menu` })
        await expect(menu).toBeVisible()
        await page.waitForTimeout(260) // entry animation
        const box = (await menu.boundingBox())!
        expect(box.x, `${item} left edge`).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, `${item} right edge`).toBeLessThanOrEqual(width)
        await page.mouse.move(5, 700)
        await expect(menu).toBeHidden()
      }
    })
  }
})

test('reduced motion disables decorative animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const durations = await page.evaluate(() => Array.from(document.querySelectorAll('[class*="marquee"], [class*="anim-"]')).map((el) => getComputedStyle(el).animationName === 'none' || parseFloat(getComputedStyle(el).animationDuration) <= 0.001))
  expect(durations.length).toBeGreaterThan(0)
  expect(durations.every(Boolean)).toBe(true)
})

test('catalogue filter dropdowns are keyboard-operable listboxes', async ({ page }) => {
  await page.goto('/connectors')
  const button = page.getByRole('button', { name: 'Sort order' })
  await button.focus()
  await page.keyboard.press('ArrowDown')
  const list = page.getByRole('listbox', { name: 'Sort order' })
  await expect(list).toBeFocused()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(list).toBeHidden()
  await expect(button).toBeFocused()
  await expect(button).toContainText('Sort: A–Z')
  await button.press('ArrowDown')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox')).toBeHidden()
  await expect(button).toContainText('Sort: A–Z')
})

test('console theme: dark by default, Light/Dark toggle persists, axe clean in light', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/app')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('group', { name: 'Colour theme' }).getByRole('button', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const found: string[] = []
  for (const p of ['/app', '/app/connectors', '/app/approvals', '/app/executions/ex_01J2P88', '/app/security']) {
    await page.goto(p)
    await page.locator('main').first().waitFor()
    await page.waitForTimeout(250)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    for (const v of r.violations) found.push(`${p} ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0].html.slice(0, 100)}`)
  }
  expect(found).toEqual([])
  // the public site stays light whatever the console preference
  await page.getByRole('group', { name: 'Colour theme' }).getByRole('button', { name: 'Dark' }).click()
  await page.goto('/pricing')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
