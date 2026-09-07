import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Order from '@/lib/models/Order'
import User from '@/lib/models/User'
import RefundCase from '@/lib/models/RefundCase'
import { seedPrivateProof } from './fixtures/refundProof'
import RefundPoint from '@/lib/models/RefundPoint'
import { createRefundCaseForOrder, switchCashPickupToIndividual, submitIndividualRefundDestination, verifyIndividualRefundDestination, declareIndividualRefund, readIndividualRefundDestination } from '../refunds/refundCases'

vi.mock('../emails/notify', () => ({ notifyUserById: vi.fn(async () => {}) }))

beforeAll(async () => { await getDb() })
beforeEach(async () => {
  vi.restoreAllMocks()
  await RefundCase.deleteMany({})
  await Order.deleteMany({})
  await Event.deleteMany({})
  await User.deleteMany({})
  await RefundPoint.deleteMany({})
})
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed(contactPhone: string | null) {
  const buyer = await User.create({ email: 'buyer@example.test', passwordHash: 'test-only', phone: '+2290197000001' })
  const event = await Event.create({ name: 'Cotonou', date: '2099-01-01', organizerId: 'organizer', createdBy: 'organizer', currency: 'XOF' })
  await RefundPoint.create({ name: 'Point Cotonou', address: 'Cotonou', city: 'Cotonou' })
  return Order.create({ userId: buyer.id, eventId: event.id, placeId: 'p1', placeType: 'Standard', qty: 1, unitPriceMinor: 10000, currency: 'XOF', rail: 'fedapay', status: 'paid', paid: true, contactPhone, expiresAt: new Date() })
}

describe('destination de remboursement distincte du contact', () => {
  async function individual() {
    const order = await seed(null)
    const result = await createRefundCaseForOrder(order, 'cancellation_option')
    if (!result.ok) throw new Error(result.error)
    await seedPrivateProof(result.refundCaseId)
    return { buyerId: order.userId, id: result.refundCaseId }
  }
  const destination = { destinationType: 'bank_account' as const, details: 'Compte bancaire du titulaire, reference de test' }
  const declaration = { reference: 'REF-DEST-1', channel: 'Banque' }
  async function readVersion(id: string) {
    const result = await readIndividualRefundDestination('organizer', id)
    if (!result.ok) throw new Error(result.error)
    return result.version
  }

  it('interdit de declarer un dossier genere sans coordonnees verifiees', async () => {
    const refund = await individual()
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toMatchObject({ error: 'not_declarable' })
    expect((await RefundCase.findById(refund.id))?.status).toBe('individual_generated')
  })

  it('ne valide pas un dossier informations requises sans destination', async () => {
    const refund = await individual()
    await RefundCase.updateOne({ _id: refund.id }, { $set: { status: 'info_required' } })
    expect(await verifyIndividualRefundDestination('organizer', refund.id, '0'.repeat(64))).toMatchObject({ error: 'not_verifiable' })
    expect((await RefundCase.findById(refund.id))?.bankDetailsVerifiedAt).toBeNull()
  })

  it('exige soumission puis verification autorisee avant declaration', async () => {
    const refund = await individual()
    expect(await submitIndividualRefundDestination('other', refund.id, destination)).toMatchObject({ ok: false })
    expect(await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)).toEqual({ ok: true })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toMatchObject({ error: 'not_declarable' })
    expect(await verifyIndividualRefundDestination('other', refund.id)).toMatchObject({ ok: false })
    expect(await verifyIndividualRefundDestination('organizer', refund.id, await readVersion(refund.id))).toEqual({ ok: true })
    expect(await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)).toMatchObject({ error: 'destination_not_editable' })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await RefundCase.findById(refund.id))?.status).toBe('declared')
  })

  it('une soumission deja lue ne peut ecraser une verification concurrente', async () => {
    const refund = await individual()
    await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)
    const version = await readVersion(refund.id)
    const snapshot = await RefundCase.findById(refund.id).select('+encryptedIndividualDestination')
    expect(snapshot).not.toBeNull()
    vi.spyOn(RefundCase, 'findOne').mockReturnValueOnce({
      select: async () => {
        expect(await verifyIndividualRefundDestination('organizer', refund.id, version)).toEqual({ ok: true })
        return snapshot
      },
    } as unknown as ReturnType<typeof RefundCase.findOne>)
    expect(await submitIndividualRefundDestination(refund.buyerId, refund.id, { ...destination, details: 'Autre compte' })).toMatchObject({ error: 'destination_not_editable' })
    const saved = await RefundCase.findById(refund.id).select('+encryptedIndividualDestination')
    expect(saved?.status).toBe('to_refund')
    expect(saved?.encryptedIndividualDestination).toBe(snapshot?.encryptedIndividualDestination)
    expect(saved?.auditTrail.filter(entry => entry.action === 'individual_destination_submitted')).toHaveLength(1)
  })

  it('reserve la consultation au proprietaire et journalise sans coordonnees en clair', async () => {
    const refund = await individual()
    await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)
    expect(await readIndividualRefundDestination('other', refund.id)).toMatchObject({ error: 'not_found' })
    expect(await readIndividualRefundDestination(refund.buyerId, refund.id)).toMatchObject({ error: 'not_found' })
    expect(await readIndividualRefundDestination('organizer', refund.id)).toMatchObject({ ok: true, details: destination.details, canVerify: true })
    const saved = await RefundCase.findById(refund.id)
    expect(saved?.auditTrail.filter(entry => entry.action === 'individual_destination_viewed')).toHaveLength(1)
    expect(JSON.stringify(saved?.auditTrail)).not.toContain(destination.details)
  })

  it('refuse une verification sans consultation et une ancienne version apres modification', async () => {
    const refund = await individual()
    await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)
    expect(await verifyIndividualRefundDestination('organizer', refund.id)).toMatchObject({ error: 'destination_review_required' })
    const oldVersion = await readVersion(refund.id)
    await submitIndividualRefundDestination(refund.buyerId, refund.id, { ...destination, details: 'Coordonnees corrigees' })
    expect(await verifyIndividualRefundDestination('organizer', refund.id, oldVersion)).toMatchObject({ error: 'destination_changed' })
    const currentVersion = await readVersion(refund.id)
    expect(currentVersion).not.toBe(oldVersion)
    expect(await verifyIndividualRefundDestination('organizer', refund.id, currentVersion)).toEqual({ ok: true })
  })

  it('refuse une consultation si le chiffrement ne peut pas etre decode', async () => {
    const refund = await individual()
    await RefundCase.updateOne({ _id: refund.id }, { $set: { encryptedIndividualDestination: 'corrupted', status: 'info_required', individualDestinationType: 'bank_account' } })
    expect(await readIndividualRefundDestination('organizer', refund.id)).toMatchObject({ error: 'destination_unavailable' })
    expect((await RefundCase.findById(refund.id))?.auditTrail.filter(entry => entry.action === 'individual_destination_viewed')).toHaveLength(0)
  })

  it('une modification pendant la verification ne peut recevoir la validation precedente', async () => {
    const refund = await individual()
    await submitIndividualRefundDestination(refund.buyerId, refund.id, destination)
    const version = await readVersion(refund.id)
    const snapshot = await RefundCase.findById(refund.id).select('+encryptedIndividualDestination')
    vi.spyOn(RefundCase, 'findOne').mockReturnValueOnce({ select: async () => {
      expect(await submitIndividualRefundDestination(refund.buyerId, refund.id, { ...destination, details: 'Nouvelle destination concurrente' })).toEqual({ ok: true })
      return snapshot
    } } as unknown as ReturnType<typeof RefundCase.findOne>)
    expect(await verifyIndividualRefundDestination('organizer', refund.id, version)).toMatchObject({ error: 'not_verifiable' })
    const saved = await RefundCase.findById(refund.id)
    expect(saved?.status).toBe('info_required')
    expect(saved?.bankDetailsVerifiedAt).toBeNull()
  })

  for (const contactPhone of [null, '+2290197000002']) {
    it(`ne deduit pas le compte payeur des contacts : ${contactPhone ?? 'profil seul'}`, async () => {
      const order = await seed(contactPhone)
      const result = await createRefundCaseForOrder(order, 'cancellation_option')
      expect(result.ok).toBe(true)
      const refund = await RefundCase.findOne({ orderId: order.id }).select('+encryptedIndividualDestination')
      expect(refund).toMatchObject({ status: 'individual_generated', individualDestinationType: null, originalPaymentDestinationMasked: null, encryptedIndividualDestination: null })
    })

    it(`invalide le code sans autoriser un virement au contact : ${contactPhone ?? 'profil seul'}`, async () => {
      const order = await seed(contactPhone)
      const result = await createRefundCaseForOrder(order, 'event_cancelled')
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.error)
      expect(await switchCashPickupToIndividual('other', result.refundCaseId)).toMatchObject({ ok: false })
      expect(await switchCashPickupToIndividual(order.userId, result.refundCaseId)).toEqual({ ok: true })
      const refund = await RefundCase.findById(result.refundCaseId).select('+encryptedIndividualDestination +encryptedPickupCode +codeHash')
      expect(refund).toMatchObject({ flow: 'individual', status: 'switched_individual', individualDestinationType: null, originalPaymentDestinationMasked: null, encryptedIndividualDestination: null, codeHash: null, encryptedPickupCode: null })
      expect(refund?.codeCancelledAt).toBeInstanceOf(Date)
      expect(await switchCashPickupToIndividual(order.userId, result.refundCaseId)).toMatchObject({ ok: false })
    })
  }
})
