export const maxDuration = 60;
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Boost from '@/lib/models/Boost'
import BoostSlot from '@/lib/models/BoostSlot'
import PaymentAlert from '@/lib/models/PaymentAlert'
import { getBoostPlan } from '@/lib/shared/boosts'
import { getEventEndTimestamp } from '@/lib/shared/eventUrgency'
import { reserveBoostSlot, releaseBoostSlotIfPending } from '@/lib/server/events/boostSlots'
import { boostSlotId, normalizeBoostRegion } from '@/lib/shared/boosts'
import { createTransaction, createToken, getTransaction, isFedapayConfigured } from '@/lib/server/payments/fedapayClient'
import { finalizeFedapayBoost } from '@/lib/server/payments/finalizeBoost'

// V1 Bénin : le barème boost est en FCFA. L'ancien checkout Stripe/EUR est
// fermé ; le checkout FedaPay boost doit être câblé avant activation payante.
const SITE = process.env.PUBLIC_SITE_URL || 'https://liveinblack.com'
const MIN_XOF = 100

const bodySchema = z.object({
  eventId: z.string().min(1),
  position: z.number().int().min(1).max(3),
  days: z.number().int(),
  boostId: z.string().regex(/^[A-Z0-9_-]{8,64}$/i),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  const requestHost = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const requestProto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const site = process.env.NODE_ENV === 'production' ? SITE : requestHost ? `${requestProto}://${requestHost}` : new URL(req.url).origin

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  const { eventId, position, days, boostId } = parsed.data

  const offer = getBoostPlan(position, days)
  if (!offer) return NextResponse.json({ error: 'invalid_offer' }, { status: 400 })

  await getDb()
  const event = await Event.findById(eventId).lean()
  if (!event) return NextResponse.json({ error: 'event_not_found' }, { status: 404 })
  if (event.organizerId !== session.user.id && event.createdBy !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (event.cancelled) return NextResponse.json({ error: 'event_cancelled' }, { status: 409 })

  const now = Date.now()
  const requestedEnd = now + offer.tier.days * 86400000
  const eventEnd = getEventEndTimestamp(event)
  if (eventEnd > 0 && requestedEnd > eventEnd) {
    return NextResponse.json({ error: 'boost_outlasts_event' }, { status: 400 })
  }

  const region = normalizeBoostRegion(event.region || '')
  const reserved = await reserveBoostSlot({ eventId, userId: session.user.id, position, region, boostId })
  if (!reserved.ok) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
  const slotId = boostSlotId(region, position)
  const amountTotal = Math.round(offer.tier.price)

  if (amountTotal < MIN_XOF) {
    await releaseBoostSlotIfPending(slotId, boostId)
    return NextResponse.json({ error: 'amount_below_minimum' }, { status: 400 })
  }

  await BoostSlot.updateOne({ slotId, boostId, status: 'pending' }, { $set: { days: offer.tier.days, price: amountTotal } })

  if (!isFedapayConfigured() && process.env.NODE_ENV !== 'production') {
    const transactionId = `dev_fedapay_boost_${boostId}`
    await BoostSlot.updateOne({ slotId, boostId, status: 'pending' }, { $set: { fedapayTxnId: transactionId } })
    const finalized = await finalizeFedapayBoost({ id: transactionId, status: 'approved', amount: amountTotal })
    if (finalized.status !== 'active') {
      await releaseBoostSlotIfPending(slotId, boostId)
      return NextResponse.json({ error: 'boost_activation_failed' }, { status: 502 })
    }
    return NextResponse.json({
      url: `${site}/boost-active?session_id=${encodeURIComponent(transactionId)}&boost_id=${encodeURIComponent(boostId)}&dev_payment=1`,
      transactionId,
      amountTotal,
      currency: 'XOF',
      simulated: true,
    })
  }

  try {
    const txn = await createTransaction({
      description: `Boost ${offer.plan.label} — ${event.name}`.slice(0, 200),
      amount: amountTotal,
      callbackUrl: `${site}/boost-active?boost_id=${encodeURIComponent(boostId)}`,
      customer: session.user.email ? { email: session.user.email } : null,
      metadata: { intent: 'boost', boostId, eventId, position: String(position), days: String(days), region, userId: session.user.id },
      reference: boostId,
    })
    const tok = await createToken(txn.id)
    await BoostSlot.updateOne({ slotId, boostId, status: 'pending' }, { $set: { fedapayTxnId: String(txn.id) } })
    return NextResponse.json({ url: tok.url, transactionId: txn.id, amountTotal, currency: 'XOF' })
  } catch (err) {
    console.error('[checkout/boost] FedaPay transaction creation failed:', err)
    await releaseBoostSlotIfPending(slotId, boostId)
    return NextResponse.json({ error: 'fedapay_error' }, { status: 502 })
  }
}

// Vérification historique côté /boost-active. L'ancien retour Stripe boost est
// fermé pour la V1 afin de ne pas valider un paiement hors périmètre.
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id') || url.searchParams.get('id')
  const boostId = url.searchParams.get('boost_id')
  if (!sessionId || !boostId) return NextResponse.json({ error: 'missing_params' }, { status: 400 })

  await getDb()
  const slot = await BoostSlot.findOne({ fedapayTxnId: String(sessionId), boostId }).lean()
  if (!slot || slot.userId !== session.user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let txn
  try {
    txn = String(sessionId).startsWith('dev_fedapay_boost_')
      ? { id: sessionId, status: 'approved', amount: Number(slot.price) || 0 }
      : await getTransaction(sessionId)
  } catch (err) {
    console.error('[checkout/boost][GET] transaction lookup failed:', err)
    return NextResponse.json({ error: 'fedapay_error' }, { status: 502 })
  }

  const finalized = await finalizeFedapayBoost(txn)
  const boost = await Boost.findOne({ boostId }).lean()
  const conflictAlert = boost ? null : await PaymentAlert.findOne({ key: `boost_slot_lost_${boostId}` }).lean()
  const boostStatus = boost?.status === 'active' ? 'active' : conflictAlert ? 'refunded_conflict' : finalized.status === 'pending' ? 'pending' : 'pending'
  const eventName = (await Event.findById(slot.eventId).select('name').lean())?.name || ''

  return NextResponse.json({
    paid: txn.status === 'approved' || boostStatus === 'active',
    paymentStatus: txn.status,
    boostStatus,
    amountTotal: txn.amount,
    metadata: {
      eventId: slot.eventId,
      eventName,
      position: String(slot.position),
      days: String(slot.days || ''),
    },
  })
}
