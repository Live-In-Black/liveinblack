import { auth } from '@/auth'
import { readRefundSignature } from '@/lib/server/refunds/signatures'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ refundId: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'auth_required' }, { status: 401, headers })
  const { refundId } = await params
  const result = await readRefundSignature(session.user.id, refundId)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers })
  return new Response(new Uint8Array(result.bytes), { headers: { ...headers, 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="signature-${refundId}.png"` } })
}
