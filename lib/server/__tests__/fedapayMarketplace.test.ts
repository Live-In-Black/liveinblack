import { describe, expect, it } from 'vitest'
import {
  fedapayMarketplaceCommissions,
  fedapaySandboxSubAccountReference,
  sanitizeFedapaySubAccountReference,
  sellerShareForOrder,
} from '../payments/fedapayMarketplace'

describe('fedapayMarketplace', () => {
  it('calcule la part organisateur sans les frais Live In Black', () => {
    expect(sellerShareForOrder({
      unitPriceMinor: 10_000,
      seatCount: 2,
      preorderTotalMinor: 3_000,
      cancellationProtectionFeeMinor: 1_000,
    })).toBe(24_000)
  })

  it('normalise la référence sous-compte FedaPay avant répartition', () => {
    expect(sanitizeFedapaySubAccountReference('  SAC  123  ')).toBe('SAC123')
    expect(sanitizeFedapaySubAccountReference('   ')).toBeNull()
  })

  it('construit le payload Marketplace documenté par FedaPay', () => {
    expect(fedapayMarketplaceCommissions(' SAC-ORG ', 12_500)).toEqual([
      { reference: 'SAC-ORG', amount: 12_500 },
    ])
    expect(fedapayMarketplaceCommissions(null, 12_500)).toBeUndefined()
    expect(fedapayMarketplaceCommissions('SAC-ORG', 0)).toBeUndefined()
  })

  it('lit la référence de sous-compte sandbox depuis l’environnement', () => {
    const previous = process.env.FEDAPAY_SANDBOX_SUB_ACCOUNT_REFERENCE

    process.env.FEDAPAY_SANDBOX_SUB_ACCOUNT_REFERENCE = ' SAC SANDBOX '
    expect(fedapaySandboxSubAccountReference()).toBe('SACSANDBOX')

    process.env.FEDAPAY_SANDBOX_SUB_ACCOUNT_REFERENCE = ''
    expect(fedapaySandboxSubAccountReference()).toBeNull()

    process.env.FEDAPAY_SANDBOX_SUB_ACCOUNT_REFERENCE = previous
  })
})
