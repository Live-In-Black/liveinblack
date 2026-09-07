import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import RefundCase from '@/lib/models/RefundCase'
import { seedPrivateProof } from './fixtures/refundProof'
import Order from '@/lib/models/Order'
import { declareIndividualRefund, confirmRefundReceived, contestDeclaredRefund } from '../refunds/refundCases'
import { notifyUserById } from '../emails/notify'

vi.mock('../emails/notify', () => ({ notifyUserById: vi.fn(async () => {}) }))
beforeAll(async () => { await getDb(); await RefundCase.init() })
beforeEach(async () => { vi.clearAllMocks(); await RefundCase.deleteMany({}); await Event.deleteMany({}); await Order.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed() {
  const event = await Event.create({ name: 'Cotonou', date: '2099-01-01', organizerId: 'organizer', createdBy: 'organizer', currency: 'XOF' })
  const order = await Order.create({ eventId: event.id, userId: 'buyer', placeId: 'p1', placeType: 'Standard', qty: 1, unitPriceMinor: 10000, currency: 'XOF', rail: 'fedapay', status: 'paid', paid: true, expiresAt: new Date() })
  const refund = await RefundCase.create({ idempotencyKey: `${event.id}:option`, eventId: event.id, orderId: order.id, buyerId: 'buyer', organizerId: 'organizer', cause: 'cancellation_option', flow: 'individual', status: 'to_refund', facialMinor: 10000, serviceFeeMinor: 500, refundableMinor: 10000 })
  await seedPrivateProof(refund.id)
  return refund
}
const declaration = { reference: 'REF-001', channel: 'Mobile Money' }

describe('declaration distincte de la reception', () => {
  it('declare sans confirmer reception et permet uniquement au beneficiaire de confirmer', async () => {
    const refund = await seed()
    expect(await declareIndividualRefund('other', refund.id, { ...declaration, proofId: refund.id })).toMatchObject({ ok: false })
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })).toEqual({ ok: true })
    expect((await RefundCase.findById(refund.id))?.status).toBe('declared')
    const makeEmail = vi.mocked(notifyUserById).mock.calls[0][1]
    const email = makeEmail()
    expect(email.subject).toContain('Remboursement déclaré')
    expect(email.html).toContain('Cette déclaration ne confirme pas')
    expect(email.html).toContain('REF-001')
    expect(await confirmRefundReceived('other', refund.id)).toMatchObject({ ok: false })
    expect(await confirmRefundReceived('buyer', refund.id)).toEqual({ ok: true })
    expect((await RefundCase.findById(refund.id))?.status).toBe('reimbursed')
    expect(await confirmRefundReceived('buyer', refund.id)).toMatchObject({ ok: false })
  })

  it('conserve la premiere preuve et reference apres contestation et nouvelle declaration', async () => {
    const refund = await seed()
    await declareIndividualRefund('organizer', refund.id, { ...declaration, proofId: refund.id })
    expect(await contestDeclaredRefund('buyer', refund.id, '   ')).toMatchObject({ error: 'contest_reason_required' })
    expect(await contestDeclaredRefund('buyer', refund.id, 'Transfert non reçu')).toEqual({ ok: true })
    const secondProofId = await seedPrivateProof(refund.id, new mongoose.Types.ObjectId().toString())
    expect(await declareIndividualRefund('organizer', refund.id, { ...declaration, reference: 'REF-002', proofId: secondProofId })).toEqual({ ok: true })
    const updated = await RefundCase.findById(refund.id)
    expect(updated?.proofs.map(proof => proof.url)).toEqual([`/api/refund-proofs/${refund.id}`, `/api/refund-proofs/${secondProofId}`])
    expect(JSON.stringify(updated?.auditTrail)).toContain('REF-001')
    expect(updated?.refundableMinor).toBe(10000)
    expect(await RefundCase.countDocuments()).toBe(1)
    expect(updated?.declaredReferences).toEqual(['REF-001', 'REF-002'])
    const another = await seed()
    expect(await declareIndividualRefund('organizer', another.id, { ...declaration, proofId: another.id })).toMatchObject({ error: 'reference_already_used' })
    await expect(RefundCase.updateOne({ _id: another.id }, { $addToSet: { declaredReferences: 'REF-001' } })).rejects.toMatchObject({ code: 11000 })
  })

  it('une seule declaration simultanee peut reserver la meme reference', async () => {
    const first = await seed()
    const second = await seed()
    const results = await Promise.all([
      declareIndividualRefund('organizer', first.id, { ...declaration, proofId: first.id }),
      declareIndividualRefund('organizer', second.id, { ...declaration, proofId: second.id }),
    ])
    expect(results.filter(result => result.ok)).toHaveLength(1)
    expect(results.find(result => !result.ok)).toMatchObject({ error: 'reference_already_used' })
    expect(await RefundCase.countDocuments({ declaredReferences: 'REF-001' })).toBe(1)
    expect(vi.mocked(notifyUserById)).toHaveBeenCalledTimes(1)
  })

  it('retrouve une reference historique pas encore reprise dans le nouvel index', async () => {
    const legacy = await seed()
    await RefundCase.updateOne({ _id: legacy.id }, { $set: { auditTrail: [{ action: 'refund_declared', actorRole: 'organizer', metadata: { reference: 'REF-001' } }] } })
    const another = await seed()
    expect(await declareIndividualRefund('organizer', another.id, { ...declaration, proofId: another.id })).toMatchObject({ error: 'reference_already_used' })
  })

  it('refuse une reference deja utilisee par cet organisateur', async () => {
    const first = await seed()
    const second = await seed()
    await declareIndividualRefund('organizer', first.id, { ...declaration, proofId: first.id })
    expect(await declareIndividualRefund('organizer', second.id, { ...declaration, proofId: second.id })).toMatchObject({ error: 'reference_already_used' })
    expect((await RefundCase.findById(second.id))?.proofs).toHaveLength(0)
  })
})
