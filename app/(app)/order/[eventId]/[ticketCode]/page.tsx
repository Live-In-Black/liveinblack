import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Ticket from '@/lib/models/Ticket'
import { listOrdersForTicket } from '@/lib/server/events/eventOrders'
import CommanderClient from './CommanderClient'

export const metadata: Metadata = {
  title: 'Mes consommations - LIVE IN BLACK',
  robots: { index: false, follow: false },
}

function Unavailable({ message }: { message: string }) {
  return (
    <main className="lb-operational-shell">
      <div className="lb-operational-workspace">
        <h1>Suivi indisponible</h1>
        <p>{message}</p>
        <Link href="/profile">Retour à Mes billets</Link>
      </div>
    </main>
  )
}

export default async function CommanderPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketCode: string }>
}) {
  const { eventId, ticketCode } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  if (!mongoose.isValidObjectId(eventId)) {
    return <Unavailable message="Ce lien de suivi n'est plus valide." />
  }

  await getDb()
  const normalizedTicketCode = ticketCode.trim().toUpperCase()
  const [event, ticket] = await Promise.all([
    Event.findById(eventId).lean(),
    Ticket.findOne({ ticketCode: normalizedTicketCode }).lean(),
  ])

  // Reading history never authorizes entry, a purchase or a refund.
  if (!event || !ticket || ticket.eventId !== eventId || String(ticket.userId) !== session.user.id) {
    return <Unavailable message="Ce billet n'est pas rattaché à ton compte ou cet événement est introuvable." />
  }

  const result = await listOrdersForTicket({ id: session.user.id }, { eventId, ticketId: normalizedTicketCode })
  if (!result.ok) {
    return <Unavailable message="Le suivi n'a pas pu être chargé. Réessaie depuis Mes billets." />
  }

  return (
    <CommanderClient
      ticketCode={ticket.ticketCode}
      eventName={ticket.eventName || event.name}
      currency={event.currency}
      initialItems={result.items}
    />
  )
}
