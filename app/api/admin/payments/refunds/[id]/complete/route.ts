import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { requireAgent } from '@/lib/server/agent/agentGuard'
import { completeManualRefund } from '@/lib/server/agent/agentPayments'
import { auditContextFromRequest } from '@/lib/server/refunds/refundCases'
import { SIGNATURE_MAX_CHARACTERS } from '@/lib/server/refunds/signatures'
import { readLimitedJson } from '@/lib/server/limitedJson'
import { checkRateLimit } from '@/lib/server/rateLimit'

const bodySchema = z.object({
  code: z.string().trim().min(8).max(128),
  signatureDataUrl: z.string().startsWith('data:image/png;base64,').max(SIGNATURE_MAX_CHARACTERS),
  operationId: z.string().uuid(),
}).strict()

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!requireAgent(session?.user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const limit = await checkRateLimit({ scope: 'cash-refund-complete', identifier: session!.user!.id, limit: 30, windowMs: 60000 })
  if (!limit.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
  const body = await readLimitedJson(req, SIGNATURE_MAX_CHARACTERS + 4096)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = bodySchema.safeParse(body.value)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })

  const { id } = await params
  const agentName = [session!.user!.name].filter(Boolean).join(' ') || session!.user!.email || 'Admin'
  const result = await completeManualRefund(
    { id: session!.user!.id, name: agentName },
    id,
    {
      code: parsed.data.code,
      signatureDataUrl: parsed.data.signatureDataUrl,
      operationId: parsed.data.operationId,
    },
    auditContextFromRequest(req)
  )
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
