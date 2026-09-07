import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/server/rateLimit'
import { REFUND_PROOF_MAX_BYTES, storePrivateRefundProof } from '@/lib/server/refunds/privateProofs'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ refundCaseId: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' }
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'auth_required' }, { status: 401, headers })
  const rate = await checkRateLimit({ scope: 'refund-proof-upload', identifier: session.user.id, limit: 20, windowMs: 3600000 })
  if (!rate.allowed) return Response.json({ error: 'rate_limited' }, { status: 429, headers: { ...headers, 'Retry-After': String(rate.retryAfterSeconds) } })
  // Read a bounded raw image, not an unbounded multipart body or a remote URL.
  const reader = req.body?.getReader()
  if (!reader) return Response.json({ error: 'proof_size_invalid' }, { status: 400, headers })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > REFUND_PROOF_MAX_BYTES) {
        await reader.cancel()
        return Response.json({ error: 'proof_size_invalid' }, { status: 413, headers })
      }
      chunks.push(chunk.value)
    }
  } catch {
    return Response.json({ error: 'proof_upload_interrupted' }, { status: 400, headers })
  } finally {
    reader.releaseLock()
  }
  const { refundCaseId } = await params
  const result = await storePrivateRefundProof(session.user.id, refundCaseId, Buffer.concat(chunks), req.headers.get('content-type') || '')
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers })
  return Response.json(result, { status: 201, headers })
}
