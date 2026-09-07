// Tests d'INTÉGRATION (vraie base MongoDB) pour la demande de remboursement
// déclenchée par le CLIENT (#B, lib/server/clientRefunds.ts) — distincte de
// l'annulation totale organisateur (organizerEventLifecycle.integration.test.ts).
// Le nouveau parcours ne déclenche aucun remboursement Stripe/FedaPay : il
// invalide les billets et crée un dossier RefundCase suivi par Live In Black.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'

import { requestClientRefund } from '../payments/clientRefunds'
import Event from '@/lib/models/Event'
import Order from '@/lib/models/Order'
import Ticket from '@/lib/models/Ticket'
import RefundCase from '@/lib/models/RefundCase'
import RefundPoint from '@/lib/models/RefundPoint'

const RUN_INTEGRATION = Boolean(process.env.MONGODB_URI)
const describeIntegration = describe.skipIf(!RUN_INTEGRATION)
const TEST_URI = process.env.MONGODB_URI || ''

beforeAll(async () => {
  if (!RUN_INTEGRATION) return
  await mongoose.connect(TEST_URI)
}, 20000)

afterAll(async () => {
  if (!RUN_INTEGRATION) return
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

beforeEach(async () => {
  if (!RUN_INTEGRATION) return
  await Event.deleteMany({})
  await Order.deleteMany({})
  await Ticket.deleteMany({})
  await RefundCase.deleteMany({})
  await RefundPoint.deleteMany({})
  await RefundPoint.create({ name: 'Point Cotonou', address: 'Rue 1, Cotonou', city: 'Cotonou', agentIds: ['agent-1'] })
})

async function seedPostponedEvent(overrides: Partial<{ refundWindowClosesAt: Date | null }> = {}) {
  return Event.create({
    name: 'Soirée Test',
    date: '2026-09-01',
    createdBy: 'org-1',
    organizerId: 'org-1',
    currency: 'XOF',
    closingDate: new Date(Date.now() + 10 * 24 * 3600_000),
    postponedFrom: { date: '2026-08-01', time: '22:00' },
    refundWindowClosesAt: overrides.refundWindowClosesAt !== undefined ? overrides.refundWindowClosesAt : new Date(Date.now() + 24 * 3600_000),
  })
}

async function seedPaidOrder(eventId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return Order.create({
    userId: '000000000000000000000001',
    eventId,
    placeId: 'p1',
    placeType: 'Standard',
    qty: 1,
    unitPriceMinor: 10000,
    currency: 'XOF',
    feeMinor: 500,
    rail: 'fedapay',
    status: 'paid',
    paid: true,
    fedapayTxnId: 'txn_test_1',
    expiresAt: new Date(Date.now() + 3600_000),
    ...overrides,
  })
}

describeIntegration('clientRefunds (intégration, vraie base) — demande de remboursement client (#B)', () => {
  it('une seule demande concurrente reussit et invalide les billets', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id))
    await Ticket.create({ ticketCode: 'ONCE', orderId: String(order._id), eventId: String(event._id), userId: order.userId, paid: true })
    const results = await Promise.all([requestClientRefund({ id: order.userId }, String(order._id)), requestClientRefund({ id: order.userId }, String(order._id))])
    expect(results.filter(result => result.ok)).toHaveLength(1)
    expect(results.find(result => !result.ok)).toMatchObject({ error: 'already_requested' })
    expect(await RefundCase.countDocuments()).toBe(1)
    expect((await Ticket.findOne({ ticketCode: 'ONCE' }))?.revoked).toBe(true)
  })

  it('priorise le report avec option et rembourse facial, frais et option', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), { cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 1000 })
    expect((await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))).ok).toBe(true)
    const refund = await RefundCase.findOne({ orderId: String(order._id) }).lean()
    expect(refund?.cause).toBe('postponed_declined')
    expect(refund?.flow).toBe('cash_pickup')
    expect(refund?.refundableMinor).toBe(11500)
  })

  it('ne substitue pas une option a une annulation automatique', async () => {
    const event = await seedPostponedEvent()
    event.cancelled = true
    await event.save()
    const order = await seedPaidOrder(String(event._id), { cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 1000 })
    expect(await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))).toMatchObject({ ok: false, error: 'event_cancelled_cash_pickup_created' })
    expect(await RefundCase.countDocuments()).toBe(0)
  })

  it('refuse une option marquee achetee sans montant paye', async () => {
    const event = await Event.create({ name: 'Test', date: '2099-01-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', closingDate: new Date(Date.now() + 10 * 86400000) })
    const order = await seedPaidOrder(String(event._id), { cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 0 })
    expect(await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))).toMatchObject({ ok: false, error: 'not_eligible' })
  })

  it('conserve le billet et permet une reprise si aucun point de retrait existe', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id))
    await Ticket.create({ ticketCode: 'KEEP', orderId: String(order._id), eventId: String(event._id), userId: '000000000000000000000001', paid: true })
    await RefundPoint.deleteMany({})
    expect(await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))).toMatchObject({ ok: false, error: 'refund_point_required' })
    expect((await Order.findById(order._id))?.clientRefundRequestedAt).toBeFalsy()
    expect((await Ticket.findOne({ ticketCode: 'KEEP' }))?.revoked).toBe(false)
    expect(await RefundCase.countDocuments()).toBe(0)
  })

  it('rembourse un billet reporté, dans la fenêtre', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id))

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: true, refunded: false, requested: true, refundCaseId: expect.any(String) })

    const updated = await Order.findById(order._id).lean()
    expect(updated?.clientRefundRequestedAt).not.toBeNull()
    expect(updated?.clientRefundReason).toBe('postponed_declined')
  })

  it('refuse si un événement annulé car le dossier de retrait est créé automatiquement ailleurs', async () => {
    const event = await Event.create({ name: 'Soirée Annulée', date: '2026-09-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', cancelled: true })
    const order = await seedPaidOrder(String(event._id))

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'event_cancelled_cash_pickup_created' })
  })

  it('refuse si l\'événement n\'est ni annulé ni reporté', async () => {
    const event = await Event.create({ name: 'Soirée Normale', date: '2026-09-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', closingDate: new Date(Date.now() + 10 * 24 * 3600_000) })
    const order = await seedPaidOrder(String(event._id))

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'not_eligible' })
  })

  it('refuse si la fenêtre de remboursement est dépassée', async () => {
    const event = await seedPostponedEvent({ refundWindowClosesAt: new Date(Date.now() - 3600_000) })
    const order = await seedPaidOrder(String(event._id))

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'refund_window_closed' })
  })

  it('refuse si au moins une place du groupe a déjà été scannée', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), { isTable: true, qty: 1, tableSeats: 4 })
    await Ticket.create({ ticketCode: 'T1', orderId: String(order._id), eventId: String(event._id), userId: '000000000000000000000001', paid: true, checkedInAt: new Date() })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'ticket_already_checked_in' })
  })

  it('rembourse tout le groupe en un seul appel du seul acheteur (order.userId)', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), { isTable: true, qty: 1, tableSeats: 4 })
    await Ticket.create({ ticketCode: 'T1', orderId: String(order._id), eventId: String(event._id), userId: '000000000000000000000001', hostUid: '000000000000000000000001', paid: true })
    await Ticket.create({ ticketCode: 'T2', orderId: String(order._id), eventId: String(event._id), userId: 'guest-2', hostUid: '000000000000000000000001', paid: true })

    const otherGuestAttempt = await requestClientRefund({ id: 'guest-2' }, String(order._id))
    expect(otherGuestAttempt).toEqual({ ok: false, status: 403, error: 'forbidden' })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: true, refunded: false, requested: true, refundCaseId: expect.any(String) })
  })

  it('refuse une seconde demande sur le même order', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id))

    const first = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(first.ok).toBe(true)

    const second = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(second).toEqual({ ok: false, status: 409, error: 'already_requested' })
  })

  it('refuse si l\'order n\'est pas payé', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), { status: 'pending', paid: false })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'order_not_paid' })
  })

  it("crée un dossier individuel si l'option d'annulation a été achetée et reste dans le délai", async () => {
    const event = await Event.create({ name: 'Soirée Normale', date: '2026-09-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', closingDate: new Date(Date.now() + 10 * 24 * 3600_000) })
    const order = await seedPaidOrder(String(event._id), { cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 1000 })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: true, refunded: false, requested: true, refundCaseId: expect.any(String) })

    const updated = await Order.findById(order._id).lean()
    expect(updated?.clientRefundReason).toBe('cancellation_option')
    const refund = await RefundCase.findOne({ orderId: String(order._id), cause: 'cancellation_option' }).lean()
    expect(refund?.flow).toBe('individual')
    expect(refund?.refundableMinor).toBe(10000)
  })

  it("l'option d'annulation ne couvre PAS un billet déjà scanné", async () => {
    const event = await Event.create({ name: 'Soirée Normale', date: '2026-09-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', closingDate: new Date(Date.now() + 10 * 24 * 3600_000) })
    const order = await seedPaidOrder(String(event._id), { cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 1000 })
    await Ticket.create({ ticketCode: 'T1', orderId: String(order._id), eventId: String(event._id), userId: '000000000000000000000001', paid: true, checkedInAt: new Date() })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'ticket_already_checked_in' })
  })

  it("un order SANS option d'annulation reste soumis aux conditions habituelles", async () => {
    const event = await Event.create({ name: 'Soirée Normale', date: '2026-09-01', createdBy: 'org-1', organizerId: 'org-1', currency: 'XOF', closingDate: new Date(Date.now() + 10 * 24 * 3600_000) })
    const order = await seedPaidOrder(String(event._id))

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'not_eligible' })
  })

  it('crée un dossier de retrait pour un report refusé FedaPay', async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), { rail: 'fedapay', currency: 'XOF', stripeSessionId: null, fedapayTxnId: 'txn_test_1' })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: true, refunded: false, requested: true, refundCaseId: expect.any(String) })

    const refund = await RefundCase.findOne({ eventId: String(event._id), orderId: String(order._id), cause: 'postponed_declined' }).select('+codeHash +encryptedPickupCode').lean()
    expect(refund?.status).toBe('code_active')
    expect(refund?.codeHash).toBeTruthy()
  })

  // Régression : un billet gratuit n'a aucun montant à rembourser et ne doit
  // jamais produire de dossier de retrait ou de remboursement individuel.
  it("refuse un billet gratuit (rail 'free') avec free_ticket_not_refundable, même en fenêtre de report", async () => {
    const event = await seedPostponedEvent()
    const order = await seedPaidOrder(String(event._id), {
      rail: 'free',
      unitPriceMinor: 0,
      feeMinor: 0,
      stripeSessionId: null,
      fedapayTxnId: null,
    })

    const result = await requestClientRefund({ id: '000000000000000000000001' }, String(order._id))
    expect(result).toEqual({ ok: false, status: 409, error: 'free_ticket_not_refundable' })

    const updated = await Order.findById(order._id).lean()
    expect(updated?.clientRefundRequestedAt).toBeFalsy()
  })
})
