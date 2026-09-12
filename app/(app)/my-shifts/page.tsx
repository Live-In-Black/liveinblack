import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listMyStaffedEvents } from '@/lib/server/organizer/staffEvents'
import { Card, Mascot } from '@/app/components/ui'
import styles from './my-shifts.module.css'

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

// `soft`/`border` sont des rgba() FIXES, jamais dérivées de `color` par
// concaténation de chaîne (ex. `${meta.color}55`) — quand color vaut
// `var(--primary)`, ça produirait littéralement `var(--primary)55`, une valeur CSS
// invalide (on ne peut pas suffixer un canal alpha à une custom property).
// Un rgba() précalculé par rôle est la seule façon correcte de garder un
// fond/bordure translucides cohérents avec `color`.
const ROLE_META: Record<string, { label: string; color: string; soft: string; border: string; desc: string }> = {
  serveur: { label: 'Serveur', color: 'var(--primary)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Prends et sers les commandes au bar' },
  scan: { label: 'Contrôle entrée', color: 'var(--violet-text)', soft: 'rgba(var(--violet-rgb), .12)', border: 'var(--violet-border)', desc: "Scanne les billets à l'entrée" },
  manager: { label: 'Manager', color: 'var(--gold)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Gestion complète de la soirée' },
  dj: { label: 'DJ', color: 'var(--danger)', soft: 'var(--danger-fill)', border: 'var(--danger-border)', desc: 'Gère la playlist interactive de la soirée' },
  // 'vendeur' (#C, lib/server/agentSales.ts) ajouté après le reste de cette
  // page — manquait ici, ce qui faisait tomber sur le fallback générique
  // (couleur grise, description vide) ET, pire, redirigeait vers le scanner
  // au lieu de /on-site-sales/[eventId] (voir roleHref ci-dessous).
  vendeur: { label: 'Vente sur place', color: 'var(--gold)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Vends des billets cash ou Mobile Money' },
  // Rôle synthétique (pas une valeur EventStaff.roster[].role) — événement
  // que l'utilisateur organise lui-même, fusionné ici depuis l'ancien
  // /scanner (index), voir lib/server/staffEvents.ts.
  owner: { label: 'Organisateur', color: 'var(--primary)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: "Ton événement — ouvre le scan pour contrôler l'entrée" },
}
const FALLBACK_ROLE_META = { label: '', color: 'var(--text-faint)', soft: 'var(--fill-secondary)', border: 'var(--border)', desc: '' }

// DJ → gestion de la playlist (#75/#47) ; vendeur → l'espace de vente sur
// place (#C) ; tout autre rôle staff (scan, serveur, manager) → le scanner,
// qui démarre en mode « contrôle entrée » et bascule lui-même en mode
// « service » dès qu'un billet est scanné (voir ScannerClient.tsx) — pas de
// state de navigation à transmettre, contrairement au legacy qui passait
// `{ mode, eventId }` en state de route.
function roleHref(eventId: string, role: string): string {
  if (role === 'dj') return `/playlist/${eventId}`
  if (role === 'vendeur') return `/on-site-sales/${eventId}`
  return `/scanner/${eventId}`
}

function roleCta(role: string): string {
  if (role === 'dj') return 'Gérer la playlist'
  if (role === 'scan' || role === 'owner') return 'Ouvrir le scan des entrées'
  if (role === 'vendeur') return 'Ouvrir la vente sur place'
  return 'Ouvrir le POS bar'
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

