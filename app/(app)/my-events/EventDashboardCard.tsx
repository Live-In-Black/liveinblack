'use client'

import Link from 'next/link'
import { Button } from '@/app/components/ui'
import { placeholderPhotoUrl } from '@/lib/shared/placeholderImage'
import type { EventActionKey, OrganizerEventView } from './types'

// Port de EventDashboardCard (MesEvenementsPage.jsx lignes 208-236) — carte
// d'un événement "en cours" avec sa grille d'actions rapides (EVENT_ACTIONS,
// lignes 187-199 du legacy).
const ACTIONS: { key: EventActionKey; label: string; color: string }[] = [
  { key: 'stats', label: 'Statistiques', color: 'var(--primary)' },
  { key: 'bookings', label: 'Réservations', color: 'var(--gold)' },
  { key: 'boost', label: 'Booster', color: 'var(--pink)' },
  { key: 'guests', label: 'Guestlist', color: 'var(--primary)' },
  { key: 'staff', label: 'Équipe', color: 'var(--gold)' },
  { key: 'promo', label: 'Codes promo', color: 'var(--text-muted)' },
  { key: 'duplicate', label: 'Dupliquer', color: 'var(--text-muted)' },
  { key: 'edit', label: 'Modifier', color: 'var(--gold)' },
  { key: 'postpone', label: 'Reporter', color: 'var(--gold)' },
  { key: 'delete', label: 'Supprimer / Annuler', color: 'var(--danger)' },
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
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
                style={{
                  minHeight: 'var(--density-action-min)',
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: action.color,
                  fontSize: 'var(--font-size-footnote-lg)',
                  fontWeight: 500,
                  letterSpacing: '.02em',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                }}
              >
                {action.label}
              </Button>
            )
          })}
        </div>
        <details style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', background: 'var(--surface-2)', overflow: 'hidden' }}>
          <summary style={{ minHeight: 'var(--density-action-min)', display: 'flex', alignItems: 'center', padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--font-size-body-sm)', fontWeight: 500 }}>
            Plus d’actions
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 7px 7px' }}>
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
                  style={{ minHeight: 'var(--density-action-min)', padding: '7px 8px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', background: 'var(--surface)', color: action.color, fontSize: 'var(--font-size-footnote-lg)', fontWeight: 500, textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {action.label}
                </Button>
              )
            })}
          </div>
        </details>
      </div>
    </article>
  )
}
