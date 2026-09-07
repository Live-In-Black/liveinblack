import { normalizeProviderBillingRegion, providerBillingCurrency } from '@/lib/shared/providerBillingRegion'

export type BillingContext = {
  billingRegionId: string
  currency: 'EUR' | 'XOF'
  canChange: boolean
}

export function deriveDefaultBillingRegionFromApplication(country: unknown): string {
  return normalizeProviderBillingRegion(country) || 'benin'
}

export function canChangeProviderBillingRegion(prestataireSubActive: boolean | null | undefined): boolean {
  return prestataireSubActive !== true
}

export function buildProviderBillingContext(input: {
  billingRegionId: unknown
  prestataireSubActive?: boolean | null
}): BillingContext {
  void input.billingRegionId
  // V1 Benin : la facturation prestataire active est exclusivement locale,
  // meme si un ancien compte porte encore une region historique.
  const billingRegionId = 'benin'
  return {
    billingRegionId,
    currency: providerBillingCurrency(billingRegionId),
    canChange: canChangeProviderBillingRegion(input.prestataireSubActive),
  }
}
