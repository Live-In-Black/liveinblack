import sharp from 'sharp'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import RefundPoint from '@/lib/models/RefundPoint'
import { decryptRefundSensitiveValue } from '@/lib/shared/refundPolicy'

export const SIGNATURE_MAX_CHARACTERS = 700_000

export async function validateRefundSignature(value: unknown): Promise<Buffer | null> {
  if (typeof value !== 'string' || value.length > SIGNATURE_MAX_CHARACTERS || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return null
  const encoded = value.slice('data:image/png;base64,'.length)
  const original = Buffer.from(encoded, 'base64')
  if (original.toString('base64') !== encoded || !original.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return null
  try {
    const pixels = await sharp(original, { limitInputPixels: 4_000_000, failOn: 'warning' })
      .flatten({ background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true })
    // Reject empty sheets and solid images, without pretending to identify handwriting.
    let ink = 0
    let paper = 0
    for (const pixel of pixels.data) { if (pixel < 100) ink++; if (pixel > 220) paper++ }
    return ink >= 20 && paper >= 20 ? original : null
  } catch { return null }
}

export async function readRefundSignature(viewerId: string, refundId: string) {
  const missing = { ok: false, status: 404, error: 'signature_not_found' } as const
  if (!viewerId || !/^[a-f\d]{24}$/i.test(refundId)) return missing
  await getDb()
  const refund = await RefundCase.findById(refundId).lean()
  if (!refund || refund.status !== 'reimbursed' || refund.flow !== 'cash_pickup' || refund.signatureUrl !== `/api/refund-signatures/${refundId}`) return missing
  const role = refund.buyerId === viewerId ? 'participant' : refund.organizerId === viewerId ? 'organizer' : 'agent'
  if (role === 'agent' && !await RefundPoint.exists({ _id: refund.refundPointId, active: true, agentIds: viewerId })) return missing
  const sensitive = await RefundCase.findById(refundId).select('+encryptedSignature').lean()
  const plaintext = decryptRefundSensitiveValue(sensitive?.encryptedSignature)
  if (!plaintext) return { ok: false, status: 503, error: 'signature_unavailable' } as const
  try {
    const payload = JSON.parse(plaintext)
    if (payload.refundId !== refundId || payload.pointId !== refund.refundPointId || payload.agentId !== refund.codeRedeemedByAgentId) return missing
    const original = await validateRefundSignature(payload.dataUrl)
    if (!original) return { ok: false, status: 503, error: 'signature_unavailable' } as const
    await RefundCase.updateOne({ _id: refund._id }, { $push: { auditTrail: {
      action: 'signature_read', actorId: viewerId, actorRole: role, metadata: { refundId },
    } } })
    return { ok: true, bytes: original } as const
  } catch { return { ok: false, status: 503, error: 'signature_unavailable' } as const }
}
