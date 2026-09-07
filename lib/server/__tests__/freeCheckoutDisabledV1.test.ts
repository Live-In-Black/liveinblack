import { describe, expect, it } from 'vitest'
import { POST as freeCheckoutRoute } from '@/app/api/checkout/free/route'
import { freeCheckout } from '../payments/freeCheckout'

describe('V1 checkout gratuit desactive', () => {
  it('refuse la route publique gratuite', async () => {
    const response = await freeCheckoutRoute(new Request('https://liveinblack.test/api/checkout/free', { method: 'POST' }))
    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({ error: 'free_checkout_disabled_v1' })
  })

  it('refuse aussi le service historique direct', async () => {
    await expect(
      freeCheckout({
        userId: 'user-1',
        eventId: 'event-1',
        placeId: 'place-1',
        qty: 1,
        isTable: false,
      })
    ).resolves.toEqual({ ok: false, status: 410, error: 'free_checkout_disabled_v1' })
  })
})
