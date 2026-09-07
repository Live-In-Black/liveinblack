import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'
import {
  cancellationOptionDeadline,
  computeCancellationOptionFeeXOF,
  computeRefundableMinor,
  decryptRefundPickupCode,
  encryptRefundPickupCode,
  encryptRefundSensitiveValue,
  decryptRefundSensitiveValue,
  isBeforeCancellationOptionDeadline,
  maskPaymentDestination,
} from '../refundPolicy'

describe('refundPolicy', () => {
  beforeEach(() => { vi.stubEnv('REFUND_CODE_SECRET', 'refund-test-only-secret') })
  afterEach(() => { vi.unstubAllEnvs() })

  it('preserve exactement les textes sensibles sans normalisation', () => {
    const value = '  Adèle de Souza\nCompte abCd-0123  '
    const encrypted = encryptRefundSensitiveValue(value)
    expect(decryptRefundSensitiveValue(encrypted)).toBe(value)
    expect(encryptRefundSensitiveValue(value)).not.toBe(encrypted)
    expect(decryptRefundSensitiveValue(encryptRefundSensitiveValue(''))).toBe('')
    expect(decryptRefundPickupCode(encryptRefundPickupCode(' abC-123 '))).toBe('ABC-123')
  })

  it('refuse les donnees alterees et une autre cle', () => {
    const encrypted = encryptRefundSensitiveValue('CaseSensitive')
    expect(decryptRefundSensitiveValue(`${encrypted}.extra`)).toBeNull()
    const parts = encrypted.split('.')
    parts[1] = (parts[1][0] === 'A' ? 'B' : 'A') + parts[1].slice(1)
    expect(decryptRefundSensitiveValue(parts.join('.'))).toBeNull()
    vi.stubEnv('REFUND_CODE_SECRET', 'different-test-only-secret')
    expect(decryptRefundSensitiveValue(encrypted)).toBeNull()
  })

  it('refuse de chiffrer sans secret configure', () => {
    vi.stubEnv('REFUND_CODE_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')
    vi.stubEnv('AUTH_SECRET', '')
    expect(() => encryptRefundSensitiveValue('private')).toThrow('refund_encryption_secret_required')
    expect(() => encryptRefundPickupCode('CODE')).toThrow('refund_encryption_secret_required')
  })

  it('lit le format historique avec la meme cle configuree, sans inventer la casse perdue', () => {
    const iv = Buffer.alloc(12, 7)
    const key = crypto.createHash('sha256').update('refund-test-only-secret').digest()
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([cipher.update('ANCIEN TITULAIRE', 'utf8'), cipher.final()])
    const historical = [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString('base64url')).join('.')
    expect(decryptRefundSensitiveValue(historical)).toBe('ANCIEN TITULAIRE')
  })

  it('calcule le prix de l’option à 10% avec seuil 5 000 FCFA et plafond 5 000', () => {
    expect(computeCancellationOptionFeeXOF(4_999, 1)).toBe(0)
    expect(computeCancellationOptionFeeXOF(10_000, 1)).toBe(1_000)
    expect(computeCancellationOptionFeeXOF(60_000, 1)).toBe(5_000)
  })

  it('ferme l’option strictement 48 heures avant la fermeture de billetterie', () => {
    const closing = new Date('2026-09-10T20:00:00.000Z')
    expect(cancellationOptionDeadline(closing)?.toISOString()).toBe('2026-09-08T20:00:00.000Z')
    expect(isBeforeCancellationOptionDeadline(closing, new Date('2026-09-08T19:59:59.000Z'))).toBe(true)
    expect(isBeforeCancellationOptionDeadline(closing, new Date('2026-09-08T20:00:00.000Z'))).toBe(false)
  })

  it('sépare remboursement option volontaire et remboursement événement/report', () => {
    const order = {
      isTable: false,
      qty: 1,
      unitPriceMinor: 10_000,
      feeMinor: 500,
      cancellationProtectionFeeMinor: 1_000,
      preorders: [{ price: 1_500, qty: 1 }],
    }
    expect(computeRefundableMinor(order, 'cancellation_option')).toBe(10_000)
    expect(computeRefundableMinor(order, 'event_cancelled')).toBe(13_000)
    expect(computeRefundableMinor(order, 'postponed_declined')).toBe(13_000)
  })

  it('chiffre les codes de retrait et masque les destinations sensibles', () => {
    const encrypted = encryptRefundPickupCode('ABC-123-SECRET')
    expect(encrypted).not.toContain('ABC-123-SECRET')
    expect(decryptRefundPickupCode(encrypted)).toBe('ABC-123-SECRET')
    expect(maskPaymentDestination('+229 97 12 34 56')).toBe('+229••••56')
  })
})
