import assert from 'node:assert/strict'
import { chromium, expect } from 'playwright/test'
import { refundSignatureHtml } from '../../LIB_Mobile/lib/refundSignatureHtml'
import { validateRefundSignature } from '../lib/server/refunds/signatures'

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 480 }, deviceScaleFactor: 2 })
    let last = ''
    await page.exposeFunction('recordSignature', (value: string) => { last = value })
    await page.setContent(refundSignatureHtml.replace('<script>', '<script>window.ReactNativeWebView={postMessage:value=>window.recordSignature(value)};'))
    const box = await page.locator('canvas').boundingBox()
    assert(box)
    await page.mouse.move(box.x + 20, box.y + 40)
    await page.mouse.down()
    await page.mouse.move(box.x + 90, box.y + 90, { steps: 12 })
    await page.mouse.move(box.x + 150, box.y + 35, { steps: 12 })
    await page.mouse.move(box.x + 240, box.y + 100, { steps: 12 })
    await page.mouse.up()
    await expect.poll(() => last).toMatch(/^data:image\/png;base64,/)
    await page.screenshot({ path: '/tmp/lib-refund-signature-browser.png' })
    assert(await validateRefundSignature(last), 'The real canvas PNG must be accepted by the server')
    const bytes = last.length
    await page.getByRole('button', { name: 'Effacer' }).click()
    await expect.poll(() => last).toBe('')
    console.log(`Capture navigateur reelle acceptee (${bytes} caracteres), puis effacement confirme. Aucun appel API ou fichier de production.`)
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
