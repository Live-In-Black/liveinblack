import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { validateRefundSignature } from '../refunds/signatures'
import { testRefundSignature } from './fixtures/refundSignature'

describe('validation PNG de signature sans reconnaissance identitaire', () => {
  it('conserve exactement les octets de la signature', async () => {
    const dataUrl = await testRefundSignature()
    expect((await validateRefundSignature(dataUrl))?.toString('base64')).toBe(dataUrl.split(',')[1])
  })
  it.each(['white', 'black', 'transparent'])('refuse une image vide ou uniforme %s', async background => {
    const png = await sharp({ create: { width: 40, height: 40, channels: 4, background } }).png().toBuffer()
    expect(await validateRefundSignature(`data:image/png;base64,${png.toString('base64')}`)).toBeNull()
  })
  it.each(['https://example.test/signature.png', 'data:image/svg+xml,<svg/>', 'data:image/png;base64,abcd', 'data:image/png;base64,' + 'a'.repeat(700000)])('refuse URL ou format invalide', async value => {
    expect(await validateRefundSignature(value)).toBeNull()
  })
  it('refuse un PNG tronque', async () => {
    const data = Buffer.from((await testRefundSignature()).split(',')[1], 'base64').subarray(0, 40)
    expect(await validateRefundSignature(`data:image/png;base64,${data.toString('base64')}`)).toBeNull()
  })
})
