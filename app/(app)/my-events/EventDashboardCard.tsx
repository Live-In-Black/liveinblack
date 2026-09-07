'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/app/components/ui'
import { placeholderPhotoUrl } from '@/lib/shared/placeholderImage'
import type { EventActionKey, OrganizerEventView } from './types'
import { BarChart3, CalendarClock, Copy, Edit3, Percent, TicketCheck, Trash2, UserRoundPlus, UsersRound, Zap } from 'lucide-react'

// Port de EventDashboardCard (MesEvenementsPage.jsx lignes 208-236) — carte
// d'un événement "en cours" avec sa grille d'actions rapides (EVENT_ACTIONS,
// lignes 187-199 du legacy).
const ACTIONS: { key: EventActionKey; label: string; color: string; icon: ReactNode }[] = [
  { key: 'stats', label: 'Statistiques', color: 'var(--primary)', icon: <BarChart3 size={15} aria-hidden="true" /> },
  { key: 'bookings', label: 'Réservations', color: 'var(--gold)', icon: <TicketCheck size={15} aria-hidden="true" /> },
  { key: 'boost', label: 'Booster', color: 'var(--pink)', icon: <Zap size={15} aria-hidden="true" /> },
  { key: 'guests', label: 'Guestlist', color: 'var(--primary)', icon: <UserRoundPlus size={15} aria-hidden="true" /> },
  { key: 'staff', label: 'Équipe', color: 'var(--gold)', icon: <UsersRound size={15} aria-hidden="true" /> },
  { key: 'promo', label: 'Codes promo', color: 'var(--text-muted)', icon: <Percent size={15} aria-hidden="true" /> },
  { key: 'duplicate', label: 'Dupliquer', color: 'var(--text-muted)', icon: <Copy size={15} aria-hidden="true" /> },
  { key: 'edit', label: 'Modifier', color: 'var(--gold)', icon: <Edit3 size={15} aria-hidden="true" /> },
  { key: 'postpone', label: 'Reporter', color: 'var(--gold)', icon: <CalendarClock size={15} aria-hidden="true" /> },
  { key: 'delete', label: 'Supprimer / Annuler', color: 'var(--danger)', icon: <Trash2 size={15} aria-hidden="true" /> },
]
const PRIMARY_ACTION_KEYS = new Set<EventActionKey>(['stats', 'bookings', 'edit', 'staff'])

function statusBadge(event: OrganizerEventView): { label: string; background: string; color: string } {
  if (event.cancelled) return { label: 'Annulé', background: 'var(--danger)', color: 'var(--danger-ink)' }
  if (event.postponed) return { label: 'Reporté', background: 'var(--gold)', color: 'var(--obsidian)' }
  if (event.publishAt && new Date(event.publishAt).getTime() > Date.now()) return { label: 'Programmé', background: 'var(--surface-2)', color: 'var(--text)' }
  return { label: 'Publié', background: 'var(--primary)', color: 'var(--primary-ink)' }
}

export default function EventDashboardCard({
  event,
  onAction,
  duplicating = false,
}: {
  event: OrganizerEventView
  onAction: (action: EventActionKey, event: OrganizerEventView) => void
  duplicating?: boolean
}) {
  const badge = statusBadge(event)

  return (
    <article
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--card-bg)',
        boxShadow: '0 10px 26px rgba(var(--black-rgb), .10)',
        overflow: 'hidden',
      }}
    >
      <div style={{ aspectRatio: '16 / 8.5', maxHeight: 138, background: `url(${event.imageUrl || placeholderPhotoUrl(event.id, 640, 340)}) center/cover`, position: 'relative', display: 'grid', placeItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '4px 10px',
            borderRadius: 999,
            font: '700 10px var(--font-open-sans)',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: badge.color,
            background: badge.background,
          }}
        >
          {badge.label}
        </span>
      </div>
      <div style={{ padding: '12px' }}>
        <h3 style={{ fontSize: 'var(--font-size-headline)', lineHeight: 1.25, fontWeight: 500, color: 'var(--text)', margin: '0 0 5px' }}>{event.name}</h3>
        <p style={{ fontSize: 'var(--font-size-footnote-lg)', fontWeight: 400, color: 'var(--text-muted)', margin: '0 0 7px' }}>
          {event.dateDisplay || event.date} · {event.city}
        </p>
        <Link
          href={`/events/${event.id}`}
          style={{ minHeight: 'var(--control-height-md)', display: 'inline-flex', alignItems: 'center', font: '600 14px var(--font-open-sans)', color: 'var(--gold)', textDecoration: 'none' }}
        >
          Voir la page de l&rsquo;événement →
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {ACTIONS.filter((action) => PRIMARY_ACTION_KEYS.has(action.key)).map((action) => {
            // 'duplicate' n'a pas de modale de confirmation (contrairement à
            // 'delete'/'postpone') — un double-clic pendant la requête POST
            // en cours créait deux événements dupliqués. Les autres actions
            // ouvrent toutes une modale/navigation, pas de risque équivalent.
            const isDuplicating = action.key === 'duplicate' && duplicating
            return (
              <Button
                key={action.key}
                variant="secondary"
                onClick={() => onAction(action.key, event)}
                disabled={isDuplicating}
                loading={isDuplicating}
                loadingText="Duplication…"
                icon={action.icon}
                aria-label={action.label}
                title={action.label}
                style={{
                  width: 36,
                  minWidth: 36,
                  height: 36,
                  minHeight: 36,
                  padding: 0,
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: action.color,
                }}
              />
            )
          })}
        </div>
        <details style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', background: 'var(--surface-2)', overflow: 'hidden' }}>
          <summary style={{ minHeight: 'var(--density-action-min)', display: 'flex', alignItems: 'center', padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--font-size-body-sm)', fontWeight: 500 }}>
            Plus d’actions
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 7px 7px' }}>
            {ACTIONS.filter((action) => !PRIMARY_ACTION_KEYS.has(action.key)).map((action) => {
              const isDuplicating = action.key === 'duplicate' && duplicating
              return (
                <Button
                  key={action.key}
                  variant="secondary"
                  onClick={() => onAction(action.key, event)}
                  disabled={isDuplicating}
                  loading={isDuplicating}
                  loadingText="Duplication…"
                  icon={action.icon}
                  aria-label={action.label}
                  title={action.label}
                  style={{ width: 36, minWidth: 36, height: 36, minHeight: 36, padding: 0, borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', background: 'var(--surface)', color: action.color }}
                />
              )
            })}
          </div>
        </details>
      </div>
    </article>
  )
}
