import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Order from '@/lib/models/Order'
import RefundCase from '@/lib/models/RefundCase'
import { seedPrivateProof } from './fixtures/refundProof'
import { declareIndividualRefund, contestDeclaredRefund } from '../refunds/refundCases'

vi.mock('../emails/notify', () => ({ notifyUserById: vi.fn(async () => {}) }))
beforeAll(async () => { await getDb(); await RefundCase.init() })
beforeEach(async () => { vi.restoreAllMocks(); await RefundCase.deleteMany({}); await Order.deleteMany({}); await Event.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed(isTable = false) {
  const event = await Event.create({ name: 'Cotonou', date: '2099-01-01', createdBy: 'organizer', organizerId: 'organizer', currency: 'XOF', places: [{ id: 'p1', type: 'Standard', total: 10, available: 7 }] })
  const order = await Order.create({ eventId: event.id, userId: 'buyer', placeId: 'p1', placeType: 'Standard', qty: 3, isTable, unitPriceMinor: 10000, currency: 'XOF', rail: 'fedapay', status: 'paid', paid: true, stockDecremented: true, expiresAt: new Date(), clientRefundReason: 'cancellation_option', clientRefundRequestedAt: new Date() })
  const refund = await RefundCase.create({ idempotencyKey: `${order.id}:option`, eventId: event.id, orderId: order.id, buyerId: 'buyer', organizerId: 'organizer', cause: 'cancellation_option', flow: 'individual', status: 'to_refund', facialMinor: 30000, serviceFeeMinor: 1500, refundableMinor: 30000 })
  await seedPrivateProof(refund.id)
  return { event, order, refund }
}
const declaration = { reference: 'REF-001', channel: 'Banque' }

describe('stock apres declaration de remboursement option', () => {
  it('ne restitue rien avant declaration autorisee puis restitue le groupe une fois', async () => {
    const { event, order, refund } = await seed()
    expect(await declareIndividualRefund('other', refund.id, { ...declaration, proofId: refund.id })).toMatchObject({ ok: false })
    expect((await Event.findById(event.id))?.places[0].available).toBe(7)
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await Event.findById(event.id))?.places[0].available).toBe(10)
    expect((await Order.findById(order.id))?.refundStockReleasedAt).toBeInstanceOf(Date)
    await contestDeclaredRefund('buyer', refund.id, 'Non recu')
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, reference: 'REF-002', proofId: refund.id })).toEqual({ ok: true })
    expect((await Event.findById(event.id))?.places[0].available).toBe(10)
  })

  it('restitue une table et non ses admissions', async () => {
    const { event, refund } = await seed(true)
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await Event.findById(event.id))?.places[0].available).toBe(8)
  })

  it('une seule declaration concurrente restitue le stock', async () => {
    const { event, refund } = await seed()
    const results = await Promise.all([declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id }), declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })])
    expect(results.filter(result => result.ok)).toHaveLength(1)
    expect((await Event.findById(event.id))?.places[0].available).toBe(10)
  })

  it('un stock incoherent annule aussi la declaration et ses preuves', async () => {
    const { event, order, refund } = await seed()
    await Event.updateOne({ _id: event.id }, { $set: { 'places.0.available': 9 } })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toMatchObject({ error: 'refund_stock_inconsistent' })
    const saved = await RefundCase.findById(refund.id)
    expect(saved?.status).toBe('to_refund')
    expect(saved?.proofs).toHaveLength(0)
    expect(saved?.declaredReferences).toHaveLength(0)
    expect((await Order.findById(order.id))?.refundStockReleasedAt).toBeNull()
    expect((await Event.findById(event.id))?.places[0].available).toBe(9)
  })

  it('ne remet pas une place en disponibilite sur un evenement annule', async () => {
    const { event, refund } = await seed()
    await Event.updateOne({ _id: event.id }, { $set: { cancelled: true } })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await Event.findById(event.id))?.places[0].available).toBe(7)
  })

  it('annule toutes les ecritures si la sauvegarde commande echoue apres celle du stock', async () => {
    const { event, order, refund } = await seed()
    vi.spyOn(Order.prototype, 'save').mockRejectedValueOnce(new Error('test_write_failure'))
    await expect(declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).rejects.toThrow('test_write_failure')
    expect((await Event.findById(event.id))?.places[0].available).toBe(7)
    expect((await Order.findById(order.id))?.refundStockReleasedAt).toBeNull()
    const saved = await RefundCase.findById(refund.id)
    expect(saved?.status).toBe('to_refund')
    expect(saved?.proofs).toHaveLength(0)
  })

  it('ne traite pas un remboursement de report comme une option volontaire', async () => {
    const { event, refund } = await seed()
    await RefundCase.updateOne({ _id: refund.id }, { $set: { cause: 'postponed_declined' } })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await Event.findById(event.id))?.places[0].available).toBe(7)
  })
})
