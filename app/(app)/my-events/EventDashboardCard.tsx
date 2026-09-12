'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/app/components/ui'
import { placeholderPhotoUrl } from '@/lib/shared/placeholderImage'
import type { EventActionKey, OrganizerEventView } from './types'
import { useState, useRef, useEffect } from 'react'
import {
  BarChart3,
  CalendarClock,
  Copy,
  Edit3,
  Percent,
  TicketCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
  Zap,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react'

// Port de EventDashboardCard (MesEvenementsPage.jsx lignes 208-236) — carte
// d'un événement "en cours" avec sa grille d'actions rapides (EVENT_ACTIONS,
// lignes 187-199 du legacy).
const ACTIONS: { key: EventActionKey; label: string; color: string; icon: ReactNode }[] = [
  { key: 'stats', label: 'Statistiques', color: 'var(--primary)', icon: <BarChart3 size={16} aria-hidden="true" /> },
  { key: 'bookings', label: 'Réservations', color: 'var(--gold)', icon: <TicketCheck size={16} aria-hidden="true" /> },
  { key: 'boost', label: 'Booster', color: 'var(--pink)', icon: <Zap size={16} aria-hidden="true" /> },
  { key: 'guests', label: 'Guestlist', color: 'var(--primary)', icon: <UserRoundPlus size={16} aria-hidden="true" /> },
  { key: 'staff', label: 'Équipe', color: 'var(--gold)', icon: <UsersRound size={16} aria-hidden="true" /> },
  { key: 'promo', label: 'Codes promo', color: 'var(--text-muted)', icon: <Percent size={16} aria-hidden="true" /> },
  { key: 'duplicate', label: 'Dupliquer', color: 'var(--text-muted)', icon: <Copy size={16} aria-hidden="true" /> },
  { key: 'edit', label: 'Modifier', color: 'var(--gold)', icon: <Edit3 size={16} aria-hidden="true" /> },
  { key: 'postpone', label: 'Reporter', color: 'var(--gold)', icon: <CalendarClock size={16} aria-hidden="true" /> },
  { key: 'delete', label: 'Supprimer / Annuler', color: 'var(--danger)', icon: <Trash2 size={16} aria-hidden="true" /> },
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
  onOpenDetail,
  duplicating = false,
}: {
  event: OrganizerEventView
  onAction: (action: EventActionKey, event: OrganizerEventView) => void
  onOpenDetail?: (event: OrganizerEventView) => void
  duplicating?: boolean
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const badge = statusBadge(event)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreOpen])

  return (
    <article
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--card-bg)',
        boxShadow: '0 10px 26px rgba(var(--black-rgb), .10)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        onClick={() => onOpenDetail?.(event)}
        style={{
          aspectRatio: '16 / 8.5',
          maxHeight: 144,
          background: `url(${event.imageUrl || placeholderPhotoUrl(event.id, 640, 340)}) center/cover`,
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          cursor: onOpenDetail ? 'pointer' : 'default',
        }}
      >
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
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          onClick={() => onOpenDetail?.(event)}
          style={{
            fontSize: 'var(--font-size-headline)',
            lineHeight: 1.25,
            fontWeight: 600,
            color: 'var(--text)',
            margin: '0 0 5px',
            cursor: onOpenDetail ? 'pointer' : 'default',
          }}
        >
          {event.name}
        </h3>
        <p style={{ fontSize: 'var(--font-size-footnote-lg)', fontWeight: 400, color: 'var(--text-muted)', margin: '0 0 7px' }}>
          {event.dateDisplay || event.date} · {event.city}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '2px 0 10px' }}>
          <button
            type="button"
            onClick={() => onOpenDetail?.(event)}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              color: 'var(--primary)',
              fontSize: 'var(--font-size-footnote)',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Détails & gestion →
          </button>
          <Link
            href={`/events/${event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Voir sur la page publique"
            aria-label="Voir sur la page publique"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '2px 6px',
              borderRadius: 6,
              background: 'var(--surface-2)',
            }}
          >
            <ExternalLink size={12} /> Page publique
          </Link>
        </div>

        {/* Boutons d'action : cercles aérés 38x38 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {ACTIONS.filter((action) => PRIMARY_ACTION_KEYS.has(action.key)).map((action) => {
            const isDuplicating = action.key === 'duplicate' && duplicating
            return (
              <Button
                key={action.key}
                variant="secondary"
                onClick={() => onAction(action.key, event)}
                disabled={isDuplicating}
                loading={isDuplicating}
                loadingText="…"
                icon={action.icon}
                aria-label={action.label}
                title={action.label}
                style={{
                  width: 38,
                  minWidth: 38,
                  height: 38,
                  minHeight: 38,
                  padding: 0,
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: action.color,
                  display: 'grid',
                  placeItems: 'center',
                }}
              />
            )
          })}

          {/* Bouton 3 points pour le reste des actions */}
          <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto' }}>
            <Button
              variant="secondary"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="Plus d'actions"
              title="Plus d'actions"
              style={{
                width: 38,
                minWidth: 38,
                height: 38,
                minHeight: 38,
                padding: 0,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: moreOpen ? 'var(--primary)' : 'var(--surface-2)',
                color: moreOpen ? 'var(--primary-ink)' : 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <MoreHorizontal size={18} />
            </Button>

            {moreOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 'calc(100% + 8px)',
                  zIndex: 50,
                  width: 190,
                  padding: 6,
                  borderRadius: 14,
                  background: 'var(--modal-surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {ACTIONS.filter((action) => !PRIMARY_ACTION_KEYS.has(action.key)).map((action) => {
                  const isDuplicating = action.key === 'duplicate' && duplicating
                  return (
                    <Button
                      key={action.key}
                      variant="ghost"
                      onClick={() => {
                        setMoreOpen(false)
                        onAction(action.key, event)
                      }}
                      disabled={isDuplicating}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        width: '100%',
                        minHeight: 36,
                        padding: '6px 10px',
                        borderRadius: 8,
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        color: action.color,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
