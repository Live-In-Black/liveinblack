import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Order from '@/lib/models/Order'
import Ticket from '@/lib/models/Ticket'
import User from '@/lib/models/User'
import CashSaleSettlement from '@/lib/models/CashSaleSettlement'
import SellerBalance from '@/lib/models/SellerBalance'
import { createOrder } from '../events/orders'
import { sellTicketOnSite } from '../agent/agentSales'
import * as settlement from '../payments/sellerSettlementMode'

vi.mock('../email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }))
vi.mock('../push', () => ({ sendPushToUser: vi.fn(), sendPushToAgents: vi.fn() }))

beforeAll(async () => { await getDb() })
beforeEach(async () => {
  vi.restoreAllMocks()
  await Promise.all([Event.deleteMany({}), Order.deleteMany({}), Ticket.deleteMany({}), User.deleteMany({}), CashSaleSettlement.deleteMany({}), SellerBalance.deleteMany({})])
})
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed(price: number, admissions: number) {
  const organizer = await User.create({ email: 'organizer@test.com', passwordHash: 'test-only', roles: ['organisateur'], activeRole: 'organisateur' })
  const buyer = await User.create({ email: 'buyer@test.com', passwordHash: 'test-only', roles: ['client'], activeRole: 'client' })
  const event = await Event.create({
    name: 'Soiree Cotonou', city: 'Cotonou', region: 'Bénin', currency: 'XOF', date: '2099-01-01', time: '22:00',
    createdBy: organizer.id, organizerId: organizer.id,
    places: [{ id: 'group', type: 'Table', price, groupType: 'group', groupMin: 2, groupMax: admissions, available: 3, total: 3 }],
  })
  return { event, organizer, buyer }
}

describe('frais groupes Benin dans les commandes reelles', () => {
  it.each([4999, 5000, 60000])('controle le seuil et le plafond de l option pour %i FCFA', async (price) => {
    const { event, buyer } = await seed(price, 2)
    await Event.updateOne({ _id: event.id }, { $set: { 'places.0.cancellationOptionEnabled': true, closingDate: new Date(Date.now() + 10 * 86400000) } })
    const result = await createOrder({ eventId: event.id, userId: buyer.id, placeId: 'group', qty: 1, isTable: true, rail: 'fedapay', cancellationProtection: true })
    if (price < 5000) {
      expect(result).toMatchObject({ ok: false, error: 'cancellation_option_unavailable' })
      expect(await Order.countDocuments()).toBe(0)
      expect((await Event.findById(event.id))?.places[0].available).toBe(3)
    } else {
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.order.cancellationProtectionPurchased).toBe(true)
      expect(result.order.cancellationProtectionFeeMinor).toBe(Math.min(price / 10, 5000))
    }
  })

  it.each(['disabled', 'deadline'])('reverifie l option dans la transaction : %s', async (change) => {
    const { event, organizer, buyer } = await seed(10000, 2)
    await Event.updateOne({ _id: event.id }, { $set: { 'places.0.cancellationOptionEnabled': true, closingDate: new Date(Date.now() + 10 * 86400000) } })
    vi.spyOn(settlement, 'resolveSellerSettlementMode').mockImplementationOnce(async () => {
      await Event.updateOne({ _id: event.id }, { $set: change === 'disabled'
        ? { 'places.0.cancellationOptionEnabled': false }
        : { closingDate: new Date(Date.now() + 48 * 3600000) } })
      return { sellerUid: organizer.id, connectMode: 'auto', fedapaySubAccountReference: 'test-only' }
    })
    const result = await createOrder({ eventId: event.id, userId: buyer.id, placeId: 'group', qty: 1, isTable: true, rail: 'fedapay', cancellationProtection: true })
    expect(result).toMatchObject({ ok: false, error: 'cancellation_option_unavailable' })
    expect(await Order.countDocuments()).toBe(0)
    expect((await Event.findById(event.id))?.places[0].available).toBe(3)
  })

  it.each([[120_000, 8, 6_000], [200_000, 10, 10_000], [500_000, 10, 15_000]])(
    'web et agent : %i FCFA, %i admissions, %i FCFA de frais', async (price, admissions, expected) => {
      const { event, organizer, buyer } = await seed(price, admissions)
      const web = await createOrder({ eventId: event.id, userId: buyer.id, placeId: 'group', qty: 1, isTable: true, rail: 'fedapay' })
      expect(web.ok).toBe(true)
      if (!web.ok) return
      expect(web.order.feeMinor).toBe(expected)
      expect(web.order.tableSeats).toBe(admissions)
      expect(web.order.unitPriceMinor).toBe(price)
      const sale = await sellTicketOnSite({ id: organizer.id }, event.id, {
        placeId: 'group', qty: 1, isTable: true, contactEmail: 'guest@test.com', method: 'cash', settlementMode: 'agent_settles',
      })
      expect(sale.ok).toBe(true)
      if (!sale.ok) return
      const order = await Order.findById(sale.orderId)
      expect(order?.feeMinor).toBe(expected)
      expect(order?.tableSeats).toBe(admissions)
      expect(sale.ticketCodes).toHaveLength(admissions)
      expect((await Event.findById(event.id))?.places[0].available).toBe(1)
    },
  )

  it('refuse de deguiser un groupe en billet individuel, sans consommer de stock', async () => {
    const { event, organizer, buyer } = await seed(120_000, 8)
    expect(await createOrder({ eventId: event.id, userId: buyer.id, placeId: 'group', qty: 1, isTable: false, rail: 'fedapay' })).toMatchObject({ ok: false, error: 'group_place_requires_bundle' })
    expect(await sellTicketOnSite({ id: organizer.id }, event.id, {
      placeId: 'group', qty: 1, isTable: false, contactEmail: 'guest@test.com', method: 'cash', settlementMode: 'agent_settles',
    })).toMatchObject({ ok: false, error: 'group_place_requires_bundle' })
    expect(await Order.countDocuments()).toBe(0)
    expect((await Event.findById(event.id))?.places[0].available).toBe(3)
  })

  it.each(['web', 'agent'])('refuse un nombre d’admissions modifie pendant une commande %s', async (channel) => {
    const { event, organizer, buyer } = await seed(120_000, 8)
    vi.spyOn(settlement, 'resolveSellerSettlementMode').mockImplementationOnce(async () => {
      await Event.updateOne({ _id: event.id }, { $set: { 'places.0.groupMax': 10 } })
      return { sellerUid: organizer.id, connectMode: 'auto', fedapaySubAccountReference: 'test-only' }
    })
    const result = channel === 'web'
      ? await createOrder({ eventId: event.id, userId: buyer.id, placeId: 'group', qty: 1, isTable: true, rail: 'fedapay' })
      : await sellTicketOnSite({ id: organizer.id }, event.id, { placeId: 'group', qty: 1, isTable: true, contactEmail: 'guest@test.com', method: 'cash', settlementMode: 'agent_settles' })
    expect(result).toMatchObject({ ok: false, status: 409, error: 'place_changed' })
    expect(await Order.countDocuments()).toBe(0)
    expect((await Event.findById(event.id))?.places[0].available).toBe(3)
  })
})
