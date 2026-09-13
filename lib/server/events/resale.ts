import { getDb } from '@/lib/db/mongoose'
import type { Types } from 'mongoose'
import Order, { type OrderDoc } from '@/lib/models/Order'
import ResaleListing, { type ResaleListingDoc } from '@/lib/models/ResaleListing'

// Module historique de revente officielle.
// V1 Benin : la revente est exclue. Les exports restent pour compatibilite
// avec d'anciens imports et webhooks, mais aucun point d'entree ne cree,
// n'achete ou ne finalise une revente.

export interface ResaleCaller {
  id: string
}

type ErrResult = { ok: false; status: number; error: string }
type ResaleDisabledResult = { ok: false; status: 410; error: 'resale_disabled_v1' }
type HistoricalListing = ResaleListingDoc & { _id: Types.ObjectId }
type HistoricalOrder = OrderDoc & { _id: Types.ObjectId }

const RESALE_DISABLED: ResaleDisabledResult = { ok: false, status: 410, error: 'resale_disabled_v1' }

// ─────────────────────────── listTicketForResale ───────────────────────────

export type ListResaleResult = ResaleDisabledResult | { ok: true; listing: HistoricalListing }

export async function listTicketForResale(caller: ResaleCaller, ticketCode: string, resalePriceMajor: number): Promise<ListResaleResult> {
  void caller
  void ticketCode
  void resalePriceMajor
  return RESALE_DISABLED
}

// ─────────────────────────── withdrawResaleListing ──────────────────────────

export type WithdrawResaleResult = ResaleDisabledResult | ErrResult | { ok: true }

export async function withdrawResaleListing(caller: ResaleCaller, listingId: string): Promise<WithdrawResaleResult> {
  void caller
  void listingId
  return RESALE_DISABLED
}

// ─────────────────────────── initiateResaleOrder ────────────────────────────

export type InitiateResaleResult = ResaleDisabledResult | { ok: true; order: HistoricalOrder }

export async function initiateResaleOrder(
  buyerCaller: ResaleCaller,
  listingId: string,
  rail: 'stripe' | 'fedapay'
): Promise<InitiateResaleResult> {
  void buyerCaller
  void listingId
  void rail
  return RESALE_DISABLED
}

// ─────────────────────────── releaseResaleOrder ─────────────────────────────
// Encore utile pour les webhooks : si une ancienne commande `kind: resale`
// revient via Stripe/FedaPay, on la marque expiree et on libere son listing.

export async function releaseResaleOrder(orderId: string, session: unknown = null): Promise<{ ok: boolean }> {
  await getDb()

  const query = Order.findById(orderId)
  if (session) query.session(session as never)
  const order = await query
  if (!order || order.kind !== 'resale' || order.status !== 'pending') return { ok: true }

  order.status = 'expired'
  await order.save(session ? { session: session as never } : undefined)

  if (order.resaleListingId) {
    const update = ResaleListing.updateOne(
      { _id: order.resaleListingId, status: 'reserved', resaleOrderId: orderId },
      { $set: { status: 'active', resaleOrderId: null } }
    )
    if (session) update.session(session as never)
    await update
  }
  return { ok: true }
}

// ─────────────────────────── fulfillResaleOrder ─────────────────────────────

export type FulfillResaleResult =
  | { status: 'already_processed' }
  | { status: 'order_not_found' }
  | { status: 'listing_not_found' }
  | { status: 'not_reserved' }
  | { status: 'amount_mismatch' }
  | { status: 'resale_disabled_v1' }
  | { status: 'ok'; ticketCodes: string[] }

export async function fulfillResaleOrder(orderId: string, opts: { paidAmountMinor?: number } = {}): Promise<FulfillResaleResult> {
  void orderId
  void opts
  return { status: 'resale_disabled_v1' }
}

// ─────────────────────── getActiveResaleListingsForEvent ────────────────────

export interface PublicResaleListingView {
  id: string
  place: string
  resalePriceMinor: number
  currency: string
  isGroupListing: boolean
  seatCount: number
}

export async function getActiveResaleListingsForEvent(eventId: string): Promise<PublicResaleListingView[]> {
  void eventId
  return []
}

// ─────────────────────────── expireStaleResaleListings ──────────────────────

export async function expireStaleResaleListings(): Promise<{ expired: number }> {
  return { expired: 0 }
}
