export const maxDuration = 60;
import { NextResponse } from 'next/server'
import stripe from '@/lib/server/payments/stripeClient'
import { runObservedRoute } from '@/lib/server/observability'
import type Stripe from 'stripe'

// Webhook Stripe historique. V1 Bénin : aucun flux actif ne doit être finalisé
// depuis Stripe. On conserve la vérification de signature pour répondre
// proprement aux anciens événements, puis on ignore.
export async function POST(req: Request) {
  return runObservedRoute(req, { route: '/api/webhooks/stripe', operation: 'stripe_webhook' }, async () => {
    const signature = req.headers.get('stripe-signature')
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 })
    if (!signature) return NextResponse.json({ error: 'missing_signature' }, { status: 400 })

    const rawBody = await req.text()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret)
    } catch (err) {
      console.error('[webhooks/stripe] signature verification failed:', err)
      return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
    }

    return NextResponse.json({ received: true, ignored: 'stripe_disabled_v1', type: event.type })
  })
}
