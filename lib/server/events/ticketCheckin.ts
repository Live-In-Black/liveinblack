import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Ticket from '@/lib/models/Ticket'
import Event from '@/lib/models/Event'
import EventStaff from '@/lib/models/EventStaff'
import OrganizerMember from '@/lib/models/OrganizerMember'
import User from '@/lib/models/User'
import { verifyTicketToken, extractTicketCode } from './ticketToken'
import { isEventEnded } from '@/lib/shared/event-time'

// Port de api/tickets.js (checkinTicket) + de la partie serveur de
// ScannerPage.jsx (processCode). Dans le legacy, l'essentiel de la
// vérification vivait CÔTÉ CLIENT (lookupTicketRegistry, entryDisplayVerdict,
// eventScanGuard...) car le SDK Firestore client pouvait lire tickets/ et
// events/ directement — le serveur (api/tickets.js) restait l'autorité finale
// mais le client devait déjà se débrouiller pour afficher un verdict fiable
// hors-ligne. Ici, le client Mongo n'a JAMAIS d'accès direct à la base : tout
// passe par cette fonction, donc toute la logique de verdict vit UNIQUEMENT
// ici, une seule fois, sans duplication client/serveur.
export interface CheckinCaller {
  id: string
  roles: string[]
}

export type CheckinInput =
  | { token: string; ticketCode?: never; eventId: string }
  | { ticketCode: string; token?: never; eventId: string }

export interface CheckinTicketView {
  ticketCode: string
  eventId: string
  eventName: string
  eventDate: string
  place: string
  totalPrice: number
  currency: string
  preorders: { name: string; price: number; qty: number; showLabel: string | null; showInfo: string | null }[]
  guestName: string | null
  // Nom du titulaire du COMPTE (jamais l'invité nommé) — permet au staff de
  // recouper visuellement avec une pièce d'identité à l'entrée même quand
  // `guestName` est absent (billet non transféré à un invité).
  holderName: string | null
}

export type CheckinResult =
  | { ok: false; status: number; error: string }
  | { ok: true; alreadyCheckedIn: boolean; pointAwarded: boolean; ticket: CheckinTicketView }

export async function checkinTicket(caller: CheckinCaller, input: CheckinInput): Promise<CheckinResult> {
  await getDb()

  const ticketCode = 'token' in input && input.token ? extractTicketCode(input.token) : input.ticketCode?.trim().toUpperCase()
  if (!ticketCode) return { ok: false, status: 400, error: 'invalid_code' }

  const ticket = await Ticket.findOne({ ticketCode })
  if (!ticket) return { ok: false, status: 404, error: 'ticket_not_found' }
  if (ticket.revoked) return { ok: false, status: 409, error: 'revoked' }

  // ── Autorisation : propriétaire/organisateur de CET événement, membre du
  // staff, ou sous-compte terrain assigné par l'organisateur. Le rôle global
  // "agent" de l'équipe LIVEINBLACK ne donne pas un passe-droit scanner : en
  // V1, un agent terrain est un client nommé sur un événement précis.
  const event = await Event.findById(ticket.eventId)
  if (!event) return { ok: false, status: 404, error: 'event_not_found' }

  // ── Le scanner appelant doit être ouvert sur LE MÊME événement que le
  // billet (bug de sécurité confirmé par audit : sans ce contrôle, un billet
  // de l'événement B se check-in avec succès depuis le scanner de
  // l'événement A — écriture irréversible de checkedInAt/checkedInBy, sans
  // qu'aucun signal d'erreur n'avertisse le staff). ──
  if (ticket.eventId !== input.eventId) return { ok: false, status: 409, error: 'wrong_event' }

  let allowed = false
  if (!allowed && (event.organizerId === caller.id || event.createdBy === caller.id)) allowed = true
  if (!allowed) {
    const staff = await EventStaff.findOne({ eventId: ticket.eventId }).lean()
    // .lean() renvoie un objet JS brut pour un champ Map (pas un vrai Map) —
    // le type inféré par Mongoose ne le reflète pas, d'où le cast.
    const roster = staff?.roster as Record<string, { role: string }> | undefined
    const entry = roster?.[caller.id]
    // Le contrôle d'entrée est autorisé aux rôles opérationnels documentés
    // (scan, serveur, manager). Le DJ reste limité à la playlist et le vendeur
    // à la billetterie sur place.
    if (entry && (entry.role === 'scan' || entry.role === 'serveur' || entry.role === 'manager')) allowed = true
  }
  if (!allowed) {
    // Vérification des sous-comptes agents de terrain de l'organisateur
    const orgMember = await OrganizerMember.findOne({
      organizerId: event.organizerId || event.createdBy,
      userId: caller.id,
      status: 'active',
      permissions: 'scan',
    }).lean()
    if (orgMember) {
      if (!orgMember.assignedEventIds?.length || orgMember.assignedEventIds.includes(ticket.eventId)) {
        allowed = true
      }
    }
  }
  if (!allowed) return { ok: false, status: 403, error: 'forbidden' }

  // ── Fraîcheur / anti-falsification. Un jeton QR est vérifié contre l'état
  // COURANT du billet (seatVersion + entryNonce) : périmé dès qu'un siège est
  // réattribué (#79), pas besoin de comparaison séparée. Une saisie manuelle
  // (pas de jeton) est refusée pour un siège déjà (ré)attribué — seul le QR à
  // jour du titulaire ACTUEL prouve la possession de l'entryNonce courant. ──
  if ('token' in input && input.token) {
    const validToken = verifyTicketToken(input.token, {
      ticketCode: ticket.ticketCode,
      seatVersion: ticket.seatVersion ?? 0,
      entryNonce: ticket.entryNonce ?? null,
    })
    if (!validToken) return { ok: false, status: 403, error: 'stale_or_invalid_token' }
  } else if (ticket.tableId && ticket.entryNonce) {
    return { ok: false, status: 403, error: 'manual_entry_not_allowed_for_reassigned_seat' }
  }

  // ── Événement : doit exister, ne pas être annulé, ne pas être terminé.
  // (Le legacy ne bloquait l'événement terminé que côté client — fermeture
  // volontaire du trou : le serveur devient l'autorité complète.) ──
  if (isEventEnded(event)) return { ok: false, status: 409, error: 'event_ended' }

  // ── Droit à l'entrée : payé, place réellement gratuite, ou invitation
  // guestlist (#7 phase organisateur — lib/server/guestlist.ts). Une place de
  // guestlist peut être n'importe quel type de place (y compris payante :
  // l'organisateur offre délibérément une table VIP) — seul `source` fait foi
  // ici, jamais le prix de la place. ──
  if (ticket.paid !== true && ticket.source !== 'guestlist') {
    if (ticket.stripeSessionId || ticket.fedapayTransactionId) {
      return { ok: false, status: 403, error: 'payment_pending' }
    }
    const place = event.places?.find((p) => p.type === ticket.place)
    const isFreePlace = place && Number(place.price) === 0
    if (!isFreePlace) return { ok: false, status: 403, error: 'not_entitled' }
  }

  // ── Check-in idempotent. Le champ `pointAwarded` reste dans la réponse pour
  // compatibilité avec les clients déployés, mais la V1 Bénin n'a pas de
  // programme de points : il reste toujours `false`.
  let alreadyCheckedIn = false
  const pointAwarded = false
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const fresh = await Ticket.findById(ticket._id).session(session)
      if (!fresh) return
      if (fresh.checkedInAt) {
        alreadyCheckedIn = true
        return
      }
      fresh.checkedInAt = new Date()
      fresh.checkedInBy = caller.id
      await fresh.save({ session })
    })
  } finally {
    await session.endSession()
  }

  // Nom du titulaire du compte, lu même pour un billet gratuit/invitation.
  // `pointAwarded` reste un champ de compatibilité, pas un programme actif.
  // Best-effort : un titulaire supprimé entre-temps ne doit jamais faire
  // échouer un check-in déjà accordé.
  let holderName: string | null = null
  if (ticket.userId && ticket.source !== 'guestlist') {
    const holderUser = await User.findById(ticket.userId).select('firstName lastName').lean()
    if (holderUser) {
      const fullName = `${holderUser.firstName ?? ''} ${holderUser.lastName ?? ''}`.trim()
      holderName = fullName || null
    }
  }

  return {
    ok: true,
    alreadyCheckedIn,
    pointAwarded,
    ticket: {
      ticketCode: ticket.ticketCode,
      eventId: ticket.eventId,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      place: ticket.place,
      totalPrice: ticket.totalPrice,
      currency: ticket.currency,
      preorders: ticket.preorders.map((p) => ({ name: p.name, price: p.price ?? 0, qty: p.qty ?? 1, showLabel: p.showLabel ?? null, showInfo: p.showInfo ?? null })),
      guestName: ticket.guestName ?? null,
      holderName,
    },
  }
}
