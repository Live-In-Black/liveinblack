import { NextResponse } from 'next/server'
import { auth } from '@/auth'

function requireProviderRole(activeRole: string | undefined) {
  return activeRole === 'prestataire'
}

// Route Stripe historique fermee pour la V1 Benin. Utiliser
// /api/subscriptions/checkout/fedapay.
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!requireProviderRole(session.user.activeRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  return NextResponse.json({ error: 'stripe_subscription_disabled_v1' }, { status: 410 })
}

// Ancien retour Checkout Stripe : aucune confirmation active ne doit modifier
// l'abonnement V1.
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!requireProviderRole(session.user.activeRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'missing_session_id' }, { status: 400 })
  void sessionId
  return NextResponse.json({ error: 'stripe_subscription_disabled_v1' }, { status: 410 })
}
