import { describe, expect, it } from 'vitest'
import {
  buildProviderBillingContext,
  canChangeProviderBillingRegion,
  deriveDefaultBillingRegionFromApplication,
} from '../provider/providerBillingUtils'

describe('providerBillingUtils', () => {
  it("dérive un défaut 'benin' si le pays d'application est absent ou inconnu", () => {
    expect(deriveDefaultBillingRegionFromApplication(undefined)).toBe('benin')
    expect(deriveDefaultBillingRegionFromApplication('atlantide')).toBe('benin')
  })

  it('normalise le pays d’application quand il est reconnu', () => {
    expect(deriveDefaultBillingRegionFromApplication('Togo')).toBe('togo')
    expect(deriveDefaultBillingRegionFromApplication('fr')).toBe('france')
    expect(deriveDefaultBillingRegionFromApplication('Sénégal')).toBe('senegal')
    expect(deriveDefaultBillingRegionFromApplication({ name: 'Bénin' })).toBe('benin')
  })

  it('dérive correctement la possibilité de changement selon l’abonnement', () => {
    expect(canChangeProviderBillingRegion(true)).toBe(false)
    expect(canChangeProviderBillingRegion(false)).toBe(true)
    expect(canChangeProviderBillingRegion(null)).toBe(true)
    expect(canChangeProviderBillingRegion(undefined)).toBe(true)
  })

  it('construit un contexte de facturation V1 toujours Benin/XOF', () => {
    expect(buildProviderBillingContext({ billingRegionId: 'Togo', prestataireSubActive: true })).toEqual({
      billingRegionId: 'benin',
      currency: 'XOF',
      canChange: false,
    })

    expect(buildProviderBillingContext({ billingRegionId: '', prestataireSubActive: false })).toEqual({
      billingRegionId: 'benin',
      currency: 'XOF',
      canChange: true,
    })

    expect(buildProviderBillingContext({ billingRegionId: { id: 'sn' }, prestataireSubActive: null })).toEqual({
      billingRegionId: 'benin',
      currency: 'XOF',
      canChange: true,
    })
  })
})
