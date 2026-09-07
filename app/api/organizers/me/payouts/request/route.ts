import { NextResponse } from 'next/server'
import { auth } from '@/auth'

function requireOrganizerRole(role: string | undefined) {
  return role === 'organisateur' || role === 'agent'
}

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!requireOrganizerRole(session.user.activeRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  return NextResponse.json({ error: 'manual_payout_request_disabled_v1' }, { status: 410 })
}
