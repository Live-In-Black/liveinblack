import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listMyStaffedEvents } from '@/lib/server/organizer/staffEvents'

// Port de src/pages/MesSoireesPage.jsx — point d'entrée du MEMBRE STAFF
// (serveur / contrôle entrée / DJ) invité sur la soirée d'un autre
// organisateur, sans avoir lui-même le rôle organisateur. Pure lecture,
// donc Server Component seul, sans sous-composant client (contrairement à
// /scanner/[eventId] ou /commander/[eventId]/[ticketCode] qui ont besoin
// d'interactivité).
//
// Fusionné avec l'ancien /scanner (index) : les deux pages répondaient à la
// même question ("quel événement dois-je ouvrir ce soir ?"), l'une listant
// les affectations roster (staff invité), l'autre les événements possédés
// (organisateur) — voir lib/server/staffEvents.ts::listMyStaffedEvents, qui
// fusionne maintenant les deux ensembles.
export const metadata: Metadata = {
  title: 'Mes soirées — LIVEINBLACK',
  robots: { index: false, follow: false },
}

import MyShiftsClient, { type StaffedEventItem } from './MyShiftsClient'

export default async function MesSoireesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const rawEvents = await listMyStaffedEvents({ id: session.user.id })
  const events: StaffedEventItem[] = rawEvents.map((ev) => ({
    eventId: ev.eventId,
    eventName: ev.eventName,
    dateDisplay: ev.dateDisplay,
    city: ev.city,
    role: ev.role,
    live: Boolean(ev.live),
    started: Boolean(ev.started),
  }))

  return <MyShiftsClient events={events} />
}
