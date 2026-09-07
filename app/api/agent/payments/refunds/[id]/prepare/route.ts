import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { requireAgent } from '@/lib/server/agent/agentGuard'
import { prepareCashRefund } from '@/lib/server/refunds/cashOperations'
import { readLimitedJson } from '@/lib/server/limitedJson'
import { checkRateLimit } from '@/lib/server/rateLimit'

const bodySchema = z.object({
  code: z.string().trim().min(8).max(128),
  operationId: z.string().uuid(),
}).strict()

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!requireAgent(session?.user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const limit = await checkRateLimit({ scope: 'cash-refund-prepare', identifier: session!.user!.id, limit: 60, windowMs: 60000 })
  if (!limit.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })

  const body = await readLimitedJson(req, 4096)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = bodySchema.safeParse(body.value)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })

  const { id } = await params
  const result = await prepareCashRefund(session!.user!.id, id, parsed.data.code, parsed.data.operationId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({
    ok: true,
    state: result.state,
    amountXOF: result.amountXOF,
    pointName: result.pointName,
    operationId: result.operationId,
  })
}
