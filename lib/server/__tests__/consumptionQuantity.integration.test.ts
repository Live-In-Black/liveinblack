import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import EventOrder from '@/lib/models/EventOrder'
import { updateEventOrderItemQuantity, type UpdateOrderItemDependencies } from '../events/eventOrderUpdateItemService'

beforeAll(async () => { await getDb() })
beforeEach(async () => { await EventOrder.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

describe('quantites conservees dans MongoDB', () => {
  it.each(['order', 'preorder', 'included'])('refuse une augmentation de %s sans modifier les donnees', async kind => {
    await EventOrder.create({ eventId: 'event-test', items: [{ id: 'item', name: 'Boisson', quantity: 2, unitPriceMinor: 1000, ticketId: 'T1', addedBy: 'buyer', kind }] })
    const before = await EventOrder.findOne({ eventId: 'event-test' }).lean()
    const deps: UpdateOrderItemDependencies = {
      loadEventContext: vi.fn(async () => ({ ok: true as const, ctx: { rank: 3, role: 'organisateur', event: {} as never } })),
      resolveCallerName: vi.fn(async () => 'Organisateur'),
      appendLog: vi.fn(),
      toItemView: vi.fn(),
      startSession: mongoose.startSession.bind(mongoose),
    }
    const result = await updateEventOrderItemQuantity({ id: 'owner' }, { eventId: 'event-test', itemId: 'item', quantity: 3 }, deps)
    expect(result).toMatchObject({ ok: false, error: kind === 'order' ? 'standalone_orders_disabled_v1' : 'purchased_quantity_locked' })
    expect(await EventOrder.findOne({ eventId: 'event-test' }).lean()).toEqual(before)
    expect(deps.appendLog).not.toHaveBeenCalled()
  })
})
