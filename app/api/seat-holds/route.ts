export const maxDuration = 60;
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { listMySeatHolds } from '@/lib/server/events/seatHolds'

// GET conserve la consultation des blocages existants. POST historique
// Stripe/EUR fermé pour la V1 Bénin ; utiliser /api/seat-holds/fedapay.

const bodySchema = z.object({
  eventId: z.string().min(1),
  placeId: z.string().min(1),
  tier: z.enum(['short', 'long']),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  const holds = await listMySeatHolds(session.user.id)
  return NextResponse.json({ ok: true, holds })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })
  void parsed.data
  return NextResponse.json({ error: 'stripe_seat_hold_disabled_v1' }, { status: 410 })
}
