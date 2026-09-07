import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { auditContextFromRequest, readIndividualRefundDestination } from '@/lib/server/refunds/refundCases'

export async function POST(req: Request, { params }: { params: Promise<{ refundCaseId: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' }
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'auth_required' }, { status: 401, headers })
  const { refundCaseId } = await params
  const result = await readIndividualRefundDestination(session.user.id, refundCaseId, auditContextFromRequest(req))
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status, headers })
  return NextResponse.json(result, { headers })
}
