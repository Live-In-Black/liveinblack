import { describe, expect, it, vi } from 'vitest'
import { getDb } from '@/lib/db/mongoose'
import { addEventOrderItem } from '../events/eventOrderAddItemService'
import { addOrderItem } from '../events/eventOrders'

vi.mock('@/lib/db/mongoose', () => ({ getDb: vi.fn(() => { throw new Error('unexpected database access') }) }))

describe('standalone consumption service disabled in V1', () => {
  it.each([addEventOrderItem, addOrderItem])('refuses both entry points without database access', async (add) => {
    const result = await add({ id: 'buyer' }, { eventId: 'event', ticketId: 'ticket', menuItemId: 'Jus', quantity: 2 })
    expect(result).toEqual({ ok: false, status: 410, error: 'standalone_orders_disabled_v1' })
    expect(getDb).not.toHaveBeenCalled()
  })

  it.each([0, -1, 50, 100, NaN])('never restores creation through a different quantity (%s)', async (quantity) => {
    expect(await addEventOrderItem({ id: 'owner' }, { eventId: '', ticketId: '', menuItemId: '', quantity }))
      .toEqual({ ok: false, status: 410, error: 'standalone_orders_disabled_v1' })
  })
})
