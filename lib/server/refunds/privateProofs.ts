import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import RefundProof from '@/lib/models/RefundProof'
import { decryptRefundSensitiveValue, encryptRefundSensitiveValue } from '@/lib/shared/refundPolicy'

export const REFUND_PROOF_MAX_BYTES = 2 * 1024 * 1024
const objectId = /^[a-f\d]{24}$/i
const unavailable = { ok: false, status: 404, error: 'proof_not_found' } as const

function originalFormat(bytes: Buffer, mime: string): string | null {
  if (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png'
  if (mime === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'
  if (mime === 'image/webp' && bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export async function storePrivateRefundProof(ownerId: string, refundCaseId: string, bytes: Buffer, mime: string) {
  if (!ownerId || !objectId.test(refundCaseId)) return unavailable
  if (!bytes.length || bytes.length > REFUND_PROOF_MAX_BYTES) return { ok: false, status: 413, error: 'proof_size_invalid' } as const
  const format = originalFormat(bytes, mime)
  if (!format) return { ok: false, status: 415, error: 'proof_format_invalid' } as const
  await getDb()
  const proofId = new mongoose.Types.ObjectId().toString()
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(async () => {
      // A write on the case serializes upload authorization with changes of its state/owner.
      const allowed = await RefundCase.updateOne({
        _id: refundCaseId, organizerId: ownerId, flow: 'individual', status: { $in: ['to_refund', 'contested'] },
      }, { $push: { auditTrail: { action: 'proof_uploaded', actorId: ownerId, actorRole: 'organizer', metadata: { proofId } } } }, { session })
      if (allowed.matchedCount !== 1) return unavailable
      const encryptedOriginal = encryptRefundSensitiveValue(JSON.stringify({
        proofId, refundCaseId, ownerId, mime, format, original: bytes.toString('base64'),
      }))
      await RefundProof.create([{ _id: proofId, refundCaseId, ownerId, encryptedOriginal }], { session })
      return { ok: true, proofId, url: `/api/refund-proofs/${proofId}` } as const
    })
  } finally {
    await session.endSession()
  }
}

export function decodePrivateRefundProof(proofId: string, proof: { refundCaseId: string; ownerId: string; encryptedOriginal?: string | null }) {
  const plaintext = decryptRefundSensitiveValue(proof.encryptedOriginal)
  if (!plaintext) return null
  try {
    const payload = JSON.parse(plaintext)
    if (payload.proofId !== proofId || payload.refundCaseId !== proof.refundCaseId || payload.ownerId !== proof.ownerId || typeof payload.original !== 'string') return null
    const bytes = Buffer.from(payload.original, 'base64')
    const format = originalFormat(bytes, payload.mime)
    if (!bytes.length || bytes.length > REFUND_PROOF_MAX_BYTES || !format || format !== payload.format) return null
    return { bytes, mime: payload.mime as string, filename: `justificatif-${proofId}.${format}` as const }
  } catch { return null }
}

export async function readPrivateRefundProof(viewerId: string, proofId: string) {
  if (!viewerId || !objectId.test(proofId)) return unavailable
  await getDb()
  const proof = await RefundProof.findById(proofId).lean()
  if (!proof) return unavailable
  const refund = await RefundCase.findOne({ _id: proof.refundCaseId, $or: [
    { organizerId: viewerId },
    { buyerId: viewerId, 'proofs.proofId': proofId },
  ] }).lean()
  if (!refund || refund.organizerId !== proof.ownerId) return unavailable
  const original = await RefundProof.findById(proofId).select('+encryptedOriginal').lean()
  const decoded = original && decodePrivateRefundProof(proofId, original)
  if (!decoded) return { ok: false, status: 503, error: 'proof_unavailable' } as const
  try {
    await RefundCase.updateOne({ _id: refund._id }, { $push: { auditTrail: {
      action: 'proof_read', actorId: viewerId, actorRole: viewerId === refund.organizerId ? 'organizer' : 'participant', metadata: { proofId },
    } } })
    return { ok: true, ...decoded } as const
  } catch {
    return { ok: false, status: 503, error: 'proof_unavailable' } as const
  }
}
