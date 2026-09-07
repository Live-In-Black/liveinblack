import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'

const bodySchema = z.object({ returnPath: z.enum(['/my-events', '/organizer-studio']).optional() })

function requireOrganizerRole(role: string | undefined) {
  return role === 'organisateur' || role === 'agent'
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!requireOrganizerRole(session.user.activeRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  return NextResponse.json({ error: 'stripe_connect_disabled_v1' }, { status: 410 })
}
