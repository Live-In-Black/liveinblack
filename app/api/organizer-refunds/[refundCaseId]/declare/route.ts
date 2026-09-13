import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { auditContextFromRequest, declareIndividualRefund } from '@/lib/server/refunds/refundCases'

const proofIdSchema = z.string().regex(/^[a-f\d]{24}$/i)

const bodySchema = z.object({
  reference: z.string().trim().min(1).max(160),
  channel: z.string().trim().min(1).max(80),
  proofId: proofIdSchema.optional(),
  proofUpload: z.object({ proofId: proofIdSchema }).strict().optional(),
  declaredAt: z.string().datetime().optional(),
}).strict().refine((body) => Boolean(body.proofId || body.proofUpload?.proofId), {
  path: ['proofUpload'],
  message: 'proof_required',
})

export async function POST(req: Request, { params }: { params: Promise<{ refundCaseId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })

  const { refundCaseId } = await params
  const proofId = parsed.data.proofUpload?.proofId ?? parsed.data.proofId
  if (!proofId) return NextResponse.json({ error: 'missing_declaration_details' }, { status: 400 })

  const result = await declareIndividualRefund(session.user.id, refundCaseId, {
    reference: parsed.data.reference,
    channel: parsed.data.channel,
    proofId,
    declaredAt: parsed.data.declaredAt ? new Date(parsed.data.declaredAt) : null,
  }, auditContextFromRequest(req))
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
