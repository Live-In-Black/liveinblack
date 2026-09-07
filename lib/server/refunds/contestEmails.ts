import { randomUUID } from 'node:crypto'
import RefundCase from '@/lib/models/RefundCase'
import User from '@/lib/models/User'
import Event from '@/lib/models/Event'
import { getDb } from '@/lib/db/mongoose'
import { decryptRefundSensitiveValue, encryptRefundSensitiveValue } from '@/lib/shared/refundPolicy'
import { refundContestResolvedEmail } from '@/lib/server/emails'
import { sendEmail } from '@/lib/server/email'

type Payload = { to: string; from: string; subject: string; html: string }

export async function sendPendingContestEmails() {
  await getDb()
  const started = Date.now()
  const counts = { sent: 0, failed: 0, uncertain: 0 }
  for (let i = 0; i < 30 && Date.now() - started < 40_000; i++) {
    const now = new Date()
    const token = randomUUID()
    const refund = await RefundCase.findOneAndUpdate(
      { contestEmailState: 'pending', contestEmailNextAt: { $lte: now }, $or: [{ contestEmailLeaseUntil: null }, { contestEmailLeaseUntil: { $lte: now } }] },
      { $set: { contestEmailLeaseToken: token, contestEmailLeaseUntil: new Date(now.getTime() + 5 * 60_000) } },
      { returnDocument: 'after', sort: { contestEmailNextAt: 1 } }
    ).select('+contestEmailPayload +contestEmailLeaseToken')
    if (!refund) break
    const locked = { _id: refund._id, contestEmailState: 'pending' as const, contestEmailLeaseToken: token }
    try {
      // Stop automatic retries before the provider's 24-hour deduplication expires.
      if (refund.contestEmailFirstAttemptAt && now.getTime() - refund.contestEmailFirstAttemptAt.getTime() >= 23 * 3600_000) {
        await RefundCase.updateOne(locked, { $set: { contestEmailState: 'uncertain', contestEmailLastError: 'delivery_requires_review', contestEmailLeaseUntil: null } })
        counts.uncertain++
        continue
      }
      let payload: Payload
      if (refund.contestEmailPayload) {
        const decoded = decryptRefundSensitiveValue(refund.contestEmailPayload)
        if (!decoded) throw new Error('payload_unavailable')
        payload = JSON.parse(decoded) as Payload
      } else {
        const buyer = await User.findById(refund.buyerId).select('email').lean()
        if (!buyer?.email) throw new Error('recipient_unavailable')
        const event = await Event.findById(refund.eventId).select('name').lean()
        const email = refundContestResolvedEmail(event?.name || 'Ton événement', refund.contestResolution || '')
        payload = { to: buyer.email, from: process.env.EMAIL_FROM || 'LIVEINBLACK <noreply@liveinblack.com>', subject: email.subject, html: email.html }
        const saved = await RefundCase.updateOne(locked, { $set: { contestEmailPayload: encryptRefundSensitiveValue(JSON.stringify(payload)) } })
        if (!saved.matchedCount) continue
      }
      if (!refund.contestEmailFirstAttemptAt) {
        const saved = await RefundCase.updateOne(locked, { $set: { contestEmailFirstAttemptAt: new Date() } })
        if (!saved.matchedCount) continue
      }
      const result = await sendEmail(payload.to, { subject: payload.subject, html: payload.html }, { from: payload.from, idempotencyKey: `refund-contest/${refund.id}` })
      if (!result.ok) throw new Error(result.error)
      await RefundCase.updateOne(locked, { $set: { contestEmailState: 'sent', contestEmailSentAt: new Date(), contestEmailLastError: null, contestEmailLeaseUntil: null } })
      counts.sent++
    } catch {
      counts.failed++
      await RefundCase.updateOne(locked, { $set: { contestEmailNextAt: new Date(Date.now() + 5 * 60_000), contestEmailLeaseUntil: null, contestEmailLastError: 'delivery_failed' } })
    }
  }
  counts.uncertain = await RefundCase.countDocuments({ contestEmailState: 'uncertain' })
  return counts
}
