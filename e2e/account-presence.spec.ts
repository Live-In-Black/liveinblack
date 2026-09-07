import { test, expect } from 'playwright/test'

test('la presence suit la session sur une page publique et cesse en arriere-plan', async ({ page }) => {
  let heartbeats = 0
  await page.route('**/api/auth/session', (route) => route.fulfill({ json: {
    user: { id: '000000000000000000000001', name: 'Compte test', email: 'presence@test.com', roles: ['client'], activeRole: 'client' },
    expires: '2099-01-01T00:00:00.000Z',
  } }))
  await page.route('**/api/users/presence', (route) => { heartbeats++; return route.fulfill({ json: { ok: true } }) })
  await page.clock.install()
  await page.goto('/cookies')
  await expect.poll(() => heartbeats).toBeGreaterThan(0)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const beforeHidden = heartbeats
  await page.clock.runFor(41_000)
  expect(heartbeats).toBe(beforeHidden)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => heartbeats).toBeGreaterThan(beforeHidden)
})

test('un visiteur deconnecte ne signale pas de presence', async ({ page }) => {
  let heartbeats = 0
  await page.route('**/api/auth/session', (route) => route.fulfill({ json: null }))
  await page.route('**/api/users/presence', (route) => { heartbeats++; return route.fulfill({ json: { ok: true } }) })
  await page.clock.install()
  await page.goto('/cookies')
  await page.clock.runFor(41_000)
  expect(heartbeats).toBe(0)
})
