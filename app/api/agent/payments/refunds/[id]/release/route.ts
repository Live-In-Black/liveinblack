import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { requireAgent } from '@/lib/server/agent/agentGuard'
import { releaseCashRefund } from '@/lib/server/refunds/cashOperations'
import { readLimitedJson } from '@/lib/server/limitedJson'
import { checkRateLimit } from '@/lib/server/rateLimit'

const bodySchema = z.object({
  operationId: z.string().uuid(),
  noCashHanded: z.literal(true),
}).strict()

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!requireAgent(session?.user)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const limit = await checkRateLimit({ scope: 'cash-refund-release', identifier: session!.user!.id, limit: 30, windowMs: 60000 })
  if (!limit.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })

  const body = await readLimitedJson(req, 4096)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = bodySchema.safeParse(body.value)
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })

  const { id } = await params
  const result = await releaseCashRefund(session!.user!.id, id, parsed.data.operationId, parsed.data.noCashHanded)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
