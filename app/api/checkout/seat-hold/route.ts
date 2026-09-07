export const maxDuration = 60;
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'

// Paiement historique du solde de blocage Stripe/EUR. V1 Bénin :
// utiliser /api/checkout/seat-hold/fedapay.

const bodySchema = z.object({ seatHoldId: z.string().min(1) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })
  void parsed.data
  return NextResponse.json({ error: 'stripe_seat_hold_disabled_v1' }, { status: 410 })
}
