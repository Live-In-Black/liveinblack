import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import User from '@/lib/models/User'
import Event from '@/lib/models/Event'
import { resolveRefundContest } from '../refunds/refundCases'
import { sendPendingContestEmails } from '../refunds/contestEmails'
import { sendEmail } from '../email'

vi.mock('../email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }))
beforeAll(async () => { await getDb() })
beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(sendEmail).mockResolvedValue({ ok: true })
  await RefundCase.deleteMany({})
  await User.deleteMany({})
  await Event.deleteMany({})
})
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed() {
  const buyer = await User.create({ email: 'buyer@example.test', passwordHash: 'test-only' })
  const event = await Event.create({ name: 'Cotonou', date: '2099-01-01', createdBy: 'organizer', organizerId: 'organizer' })
  return RefundCase.create({ idempotencyKey: `case:${event.id}`, eventId: event.id, orderId: new mongoose.Types.ObjectId().toString(), buyerId: buyer.id, organizerId: 'organizer', cause: 'cancellation_option', flow: 'individual', status: 'contested', facialMinor: 10000, serviceFeeMinor: 500, refundableMinor: 10000, declaredReference: 'REF-001' })
}

describe('notification durable de decision sur contestation', () => {
  it('enregistre la notification avec la decision, puis envoie sans changer la dette', async () => {
    const refund = await seed()
    expect(await resolveRefundContest('other', refund.id, 'Decision')).toMatchObject({ ok: false })
    expect((await RefundCase.findById(refund.id))?.contestEmailState).toBeNull()
    expect(await resolveRefundContest('organizer', refund.id, 'Transfert confirmé <script>alert(1)</script>')).toEqual({ ok: true })
    expect((await RefundCase.findById(refund.id))?.contestEmailState).toBe('pending')
    expect(sendEmail).not.toHaveBeenCalled()
    expect(await sendPendingContestEmails()).toEqual({ sent: 1, failed: 0, uncertain: 0 })
    const email = vi.mocked(sendEmail).mock.calls[0][1]
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('ne confirme pas la réception')
    const saved = await RefundCase.findById(refund.id)
    expect(saved).toMatchObject({ status: 'contest_resolved', refundableMinor: 10000, declaredReference: 'REF-001', contestEmailState: 'sent' })
    expect(await resolveRefundContest('organizer', refund.id, 'Autre')).toMatchObject({ ok: false })
    await sendPendingContestEmails()
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('reprend un echec avec destinataire contenu et cle identiques', async () => {
    const refund = await seed()
    await resolveRefundContest('organizer', refund.id, 'Decision motivée')
    vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, error: 'email_provider_error' })
    expect((await sendPendingContestEmails()).failed).toBe(1)
    const first = vi.mocked(sendEmail).mock.calls[0]
    await User.updateOne({ _id: refund.buyerId }, { $set: { email: 'changed@example.test' } })
    await Event.updateOne({ _id: refund.eventId }, { $set: { name: 'Autre titre' } })
    await RefundCase.updateOne({ _id: refund.id }, { $set: { contestEmailNextAt: new Date(0) } })
    expect((await sendPendingContestEmails()).sent).toBe(1)
    expect(vi.mocked(sendEmail).mock.calls[1]).toEqual(first)
  })

  it('deux workers concurrents ne traitent pas le meme dossier', async () => {
    const refund = await seed()
    await resolveRefundContest('organizer', refund.id, 'Decision')
    const results = await Promise.all([sendPendingContestEmails(), sendPendingContestEmails()])
    expect(results.reduce((sum, result) => sum + result.sent, 0)).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('ne retente pas automatiquement au dela de la fenetre de deduplication', async () => {
    const refund = await seed()
    await resolveRefundContest('organizer', refund.id, 'Decision')
    await RefundCase.updateOne({ _id: refund.id }, { $set: { contestEmailFirstAttemptAt: new Date(Date.now() - 24 * 3600_000) } })
    expect((await sendPendingContestEmails()).uncertain).toBe(1)
    expect(sendEmail).not.toHaveBeenCalled()
    expect((await RefundCase.findById(refund.id))?.status).toBe('contest_resolved')
    expect((await sendPendingContestEmails()).uncertain).toBe(1)
  })

  it('conserve la decision si le destinataire manque et reprend un bail expire', async () => {
    const refund = await seed()
    await resolveRefundContest('organizer', refund.id, 'Decision')
    await User.deleteMany({})
    expect((await sendPendingContestEmails()).failed).toBe(1)
    expect(sendEmail).not.toHaveBeenCalled()
    const saved = await RefundCase.findById(refund.id)
    expect(saved?.status).toBe('contest_resolved')
    expect(saved?.contestEmailFirstAttemptAt).toBeNull()
    await User.create({ _id: refund.buyerId, email: 'restored@example.test', passwordHash: 'test-only' })
    await RefundCase.updateOne({ _id: refund.id }, { $set: { contestEmailNextAt: new Date(0), contestEmailLeaseUntil: new Date(0), contestEmailLeaseToken: 'abandoned' } })
    expect((await sendPendingContestEmails()).sent).toBe(1)
  })
})
