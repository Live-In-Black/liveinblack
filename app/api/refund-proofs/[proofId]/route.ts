import { auth } from '@/auth'
import { readPrivateRefundProof } from '@/lib/server/refunds/privateProofs'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ proofId: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'auth_required' }, { status: 401, headers })
  const { proofId } = await params
  const result = await readPrivateRefundProof(session.user.id, proofId)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers })
  return new Response(new Uint8Array(result.bytes), { headers: {
    ...headers,
    'Content-Type': result.mime,
    'Content-Disposition': `attachment; filename="${result.filename}"`,
    'Content-Security-Policy': "default-src 'none'; sandbox",
  } })
}
