import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import { listOrganizerRefundCases, listParticipantRefundCases } from '../refunds/refundCases'

beforeAll(async () => { await getDb() })
beforeEach(async () => { await RefundCase.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed() {
  return RefundCase.create({
    idempotencyKey: 'history-test', eventId: 'event', orderId: 'order', buyerId: 'buyer', organizerId: 'organizer',
    cause: 'cancellation_option', flow: 'individual', status: 'declared', currency: 'XOF',
    facialMinor: 10000, serviceFeeMinor: 500, refundableMinor: 10000,
    declaredReference: 'TRANSFER-1', proofs: [{ url: 'https://example.test/proof.png', uploadedBy: 'organizer' }],
    auditTrail: [{
      at: new Date('2026-09-06T12:00:00Z'), action: 'refund_declared', actorRole: 'organizer', actorId: 'internal-actor-id',
      metadata: { technical: { ip: '192.0.2.42', userAgent: 'private-browser-fingerprint' }, secret: 'future-secret-field' },
      before: { bank: 'private-bank-data' }, after: { token: 'private-token' },
    }],
  })
}

describe('historique public de remboursement sans donnees techniques', () => {
  it.each(['participant', 'organizer'])('limite la vue %s sans modifier la preuve originale', async viewer => {
    const refund = await seed()
    const before = await RefundCase.collection.findOne({ _id: refund._id })
    const rows = viewer === 'participant' ? await listParticipantRefundCases('buyer') : await listOrganizerRefundCases('organizer')
    expect(rows).toHaveLength(1)
    expect(rows[0].auditTrail).toEqual([{ at: '2026-09-06T12:00:00.000Z', action: 'refund_declared', actorRole: 'organizer' }])
    expect(JSON.stringify(rows)).not.toMatch(/192\.0\.2|private-browser|future-secret|private-bank|private-token|internal-actor-id/)
    expect(rows[0].declaredReference).toBe('TRANSFER-1')
    expect(rows[0].proofs).toHaveLength(1)
    expect(await RefundCase.collection.findOne({ _id: refund._id })).toEqual(before)
  })

  it('ne donne pas acces au dossier a une autre partie', async () => {
    await seed()
    expect(await listParticipantRefundCases('other')).toEqual([])
    expect(await listOrganizerRefundCases('other')).toEqual([])
  })
})
