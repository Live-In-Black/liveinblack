// Tests UNITAIRES purs (aucune base) pour lib/shared/payoutMomoValidation.ts
// (#7 phase organisateur — port de la validation de src/components/MomoPayoutManager.jsx).
import { describe, it, expect } from 'vitest'
import { validateMomoNumber, MOMO_REGIONS } from '../payoutMomoValidation'

describe('MOMO_REGIONS', () => {
  it('ne contient que les régions Mobile Money du lancement Bénin', () => {
    expect(MOMO_REGIONS.length).toBeGreaterThan(0)
    expect(MOMO_REGIONS.every((r) => Boolean(r.momoCountry))).toBe(true)
    expect(MOMO_REGIONS.map((r) => r.momoCountry)).toEqual(['bj'])
    expect(MOMO_REGIONS.some((r) => r.id === 'france')).toBe(false)
    expect(MOMO_REGIONS.some((r) => r.id === 'togo')).toBe(false)
  })
})

describe('validateMomoNumber', () => {
  it('refuse un pays Mobile Money inconnu', () => {
    const result = validateMomoNumber('xx', '+228 90 00 00 00')
    expect(result.ok).toBe(false)
  })

  it('refuse les anciens pays Mobile Money hors lancement Bénin', () => {
    const result = validateMomoNumber('tg', '+228 90 00 00 00')
    expect(result.ok).toBe(false)
  })

  it('refuse un numéro vide', () => {
    const result = validateMomoNumber('bj', '   ')
    expect(result.ok).toBe(false)
  })

  it("refuse un numéro qui ne commence pas par l'indicatif du pays", () => {
    const result = validateMomoNumber('bj', '+228 90 00 00 00')
    expect(result.ok).toBe(false)
  })

  it('refuse un numéro trop court', () => {
    const result = validateMomoNumber('bj', '+229123')
    expect(result.ok).toBe(false)
  })

  it('accepte un numéro valide et le normalise (retire espaces/points/tirets)', () => {
    const result = validateMomoNumber('bj', '+229 01.97-00 00 00')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.number).toBe('+2290197000000')
  })
})
