import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getMySubscriptionOverview } from '@/lib/server/provider/providerSubscriptions'

function requireProviderRole(activeRole: string | undefined) {
  return activeRole === 'prestataire'
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!requireProviderRole(session.user.activeRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const overview = await getMySubscriptionOverview({ id: session.user.id })
  return NextResponse.json({ ok: true, ...overview })
}
