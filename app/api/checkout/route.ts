export const maxDuration = 60;
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getDb } from '@/lib/db/mongoose'
import { runObservedRoute } from '@/lib/server/observability'
import Order from '@/lib/models/Order'
import Ticket from '@/lib/models/Ticket'
import Event from '@/lib/models/Event'
import { getVercelOpsConfig } from '@/lib/server/vercelEdgeConfig'

// Route historique Stripe/EUR. V1 Bénin : le checkout actif est
// /api/checkout/fedapay ; cette route reste uniquement pour relire un ancien
// retour Stripe/free et refuser explicitement toute nouvelle création.

const preorderItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  qty: z.number().int().min(0).max(50),
  showOptionId: z.string().trim().min(1).max(80).optional(),
  showInfo: z.string().trim().max(240).optional(),
})

const bodySchema = z.object({
  eventId: z.string().min(1),
  placeId: z.string().min(1),
  qty: z.number().int().min(1).max(20).default(1),
  isTable: z.boolean().default(false),
  promoCode: z.string().trim().optional().nullable(),
  preorders: z.array(preorderItemSchema).max(50).default([]),
  ticketPreorders: z.array(z.object({ ticketIndex: z.number().int().min(0).max(49), items: z.array(preorderItemSchema).max(50) })).max(50).default([]),
  cancellationProtection: z.boolean().default(false),
})

export async function POST(req: Request) {
  return runObservedRoute(req, { route: '/api/checkout', operation: 'checkout_post' }, async () => {
    const opsConfig = await getVercelOpsConfig()
    if (opsConfig.maintenanceMode) return NextResponse.json({ error: 'maintenance_mode' }, { status: 503 })
    if (!opsConfig.checkoutEnabled) return NextResponse.json({ error: 'checkout_disabled' }, { status: 503 })

    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })
    void parsed.data

    return NextResponse.json({ error: 'stripe_checkout_disabled_v1' }, { status: 410 })
  })
}

export async function GET(req: Request) {
  return runObservedRoute(req, { route: '/api/checkout', operation: 'checkout_get' }, async () => {
    const opsConfig = await getVercelOpsConfig()
    if (opsConfig.maintenanceMode) return NextResponse.json({ error: 'maintenance_mode' }, { status: 503 })

    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')
    // order_id : retour de app/api/checkout/free/route.ts (rail 'free', billet
    // déjà émis SYNCHRONE — jamais de session Stripe à relire pour ce cas).
    const orderId = url.searchParams.get('order_id')
    if (!sessionId && !orderId) return NextResponse.json({ error: 'missing_session_id' }, { status: 400 })

    await getDb()

    let order
    let paid: boolean
    let paymentStatus: string
    let amountTotal: number | null = null
    let currency: string | null = null

    if (sessionId) {
      order = await Order.findOne({ stripeSessionId: sessionId }).lean()
      if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      paid = order.status === 'paid'
      paymentStatus = order.status
      amountTotal = null
      currency = order.currency
    } else {
      order = await Order.findById(orderId).lean()
      // order_id n'est un identifiant valide que pour une commande rail='free'
      // — jamais un moyen détourné de relire une commande Stripe/FedaPay sans
      // passer par leur vérification respective.
      if (order && order.rail !== 'free') return NextResponse.json({ error: 'not_found' }, { status: 404 })
      paid = order?.status === 'paid'
      paymentStatus = paid ? 'paid' : order?.status || 'unknown'
    }

    if (!order || order.userId !== session.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const event = await Event.findById(order.eventId).select('name').lean()
    const tickets =
      order.status === 'paid'
        ? await Ticket.find({ orderId: order._id.toString(), userId: session.user.id }).select('ticketCode').lean()
        : []

    return NextResponse.json({
      paid,
      paymentStatus,
      amountTotal,
      currency,
      orderStatus: order.status,
      eventName: event?.name || '',
      ticketCount: tickets.length,
    })
  })
}
