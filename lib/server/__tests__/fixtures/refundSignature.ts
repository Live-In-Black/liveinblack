import sharp from 'sharp'

export async function testRefundSignature() {
  const pixels = Buffer.alloc(96 * 48 * 3, 255)
  for (let x = 10; x < 85; x++) {
    for (let dy = 0; dy < 3; dy++) {
      const index = ((12 + (x % 15) + dy) * 96 + x) * 3
      pixels.fill(20, index, index + 3)
    }
  }
  const png = await sharp(pixels, { raw: { width: 96, height: 48, channels: 3 } }).png().toBuffer()
  return `data:image/png;base64,${png.toString('base64')}`
}
