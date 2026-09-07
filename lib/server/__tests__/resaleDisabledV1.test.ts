import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { toWalletItemView } from '../events/tickets'
import { fulfillResaleOrder, initiateResaleOrder, listTicketForResale as listTicketForResaleService } from '../events/resale'

describe('V1 revente desactivee', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret'
  })

  it.each([
    'app/api/checkout/resale/route.ts',
    'app/api/checkout/resale/fedapay/route.ts',
    'app/api/events/[eventId]/resale-listings/route.ts',
    'app/api/resale-listings/[listingId]/route.ts',
    'app/api/tickets/resell/route.ts',
    'app/api/cron/resale-expiry/route.ts',
  ])('ne conserve pas la route source %s', (relativePath) => {
    expect(existsSync(join(process.cwd(), relativePath))).toBe(false)
  })

  it('ne projette jamais un billet comme revendable dans le wallet V1', () => {
    const view = toWalletItemView(
      {
        ticketCode: 'T-1',
        place: 'Standard',
        placePrice: 5000,
        totalPrice: 5000,
        currency: 'XOF',
        userId: 'buyer',
        source: 'fedapay-webhook',
        resaleListingId: 'legacy-listing',
        resaleCount: 0,
      },
      'buyer',
      new Set(),
      new Set(),
      new Map([['legacy-listing', { resalePriceMinor: 4500, feeMinor: 225, sellerNetMinor: 4275, status: 'active' }]]),
      true
    )
    expect(view.resellable).toBe(false)
    expect(view.activeListing).toBeNull()
  })

  it('neutralise aussi les points d’entrée service historiques', async () => {
    await expect(listTicketForResaleService({ id: 'seller-1' }, 'TICKET-1', 5000)).resolves.toEqual({
      ok: false,
      status: 410,
      error: 'resale_disabled_v1',
    })
    await expect(initiateResaleOrder({ id: 'buyer-1' }, 'listing-1', 'fedapay')).resolves.toEqual({
      ok: false,
      status: 410,
      error: 'resale_disabled_v1',
    })
    await expect(fulfillResaleOrder('order-1')).resolves.toEqual({ status: 'resale_disabled_v1' })
  })
})
