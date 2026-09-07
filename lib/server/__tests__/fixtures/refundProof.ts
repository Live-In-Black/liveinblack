import RefundProof from '@/lib/models/RefundProof'
import { encryptRefundSensitiveValue } from '@/lib/shared/refundPolicy'

// Direct fixture: destination/stock suites exercise declaration, not the upload UI.
export async function seedPrivateProof(refundCaseId: string, proofId = refundCaseId) {
  const ownerId = 'organizer'
  await RefundProof.create({ _id: proofId, refundCaseId, ownerId, encryptedOriginal: encryptRefundSensitiveValue(JSON.stringify({
    proofId, refundCaseId, ownerId, mime: 'image/png', format: 'png',
    original: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6QAAAABJRU5ErkJggg==',
  })) })
  return proofId
}
