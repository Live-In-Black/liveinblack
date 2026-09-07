'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { isEventEnded } from '@/lib/shared/event-time'
import { fmtMoney } from '@/lib/shared/money'
import EventInterestButtonClient from '@/app/components/features/events/EventInterestButtonClient'
import { ActionLink, Card, EmptyState, Pagination, pagedSlice } from '@/app/components/ui'
import { placeholderPhotoUrl } from '@/lib/shared/placeholderImage'
import styles from './InterestedEventsClient.module.css'

const PAGE_SIZE = 20

// Port de src/pages/InterestedEventsPage.jsx (#6 phase profil).

interface InterestedEventView {
  id: string
  name: string
  subtitle: string
  date: string
  dateDisplay: string
  time: string
  endTime: string
  city: string
  category: string
  imageUrl: string | null
  color: string
  cancelled: boolean
  currency: 'EUR' | 'XOF'
  minPrice: number | null
}

export interface EventInterestItemView {
  eventId: string
  createdAt: string
  event: InterestedEventView | null
}

export default function InterestedEventsClient({ initialItems }: { initialItems: EventInterestItemView[] }) {
  const [items, setItems] = useState(initialItems)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [inactivePage, setInactivePage] = useState(1)

  function remove(eventId: string) {
    setItems((list) => list.filter((i) => i.eventId !== eventId))
  }

  const { upcoming, inactive } = useMemo(() => {
    const upcoming: EventInterestItemView[] = []
    const inactive: EventInterestItemView[] = []
    for (const item of items) {
      if (!item.event) {
        inactive.push(item)
      } else if (!isEventEnded(item.event)) {
        upcoming.push(item)
      } else {
        inactive.push(item)
      }
    }
    return { upcoming, inactive }
  }, [items])

  const { pageItems: pagedUpcoming, pageCount: upcomingPageCount } = pagedSlice(upcoming, upcomingPage, PAGE_SIZE)
  const { pageItems: pagedInactive, pageCount: inactivePageCount } = pagedSlice(inactive, inactivePage, PAGE_SIZE)

  return (
    <main className="lb-dashboard-page">
      <div className={styles.pageContent}>
        <div className={styles.headerRow}>
          <header className={styles.header}>
            <p>Ta sélection</p>
            <h1>Mes favoris</h1>
            <span>Retrouve les événements sauvegardés et prépare ta prochaine sortie.</span>
          </header>
          <ActionLink href="/events">Explorer les événements</ActionLink>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Aucun événement sauvegardé"
            description="Sur une fiche événement, clique sur Intéressé pour le retrouver ici."
          />
        ) : (
          <>
            <Section label={`À venir ${upcoming.length}`}>
              {upcoming.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-callout)', color: 'var(--text-faint)' }}>Aucun événement à venir dans ta liste pour l&apos;instant.</p>
              ) : (
                <>
                  <Grid>
                    {pagedUpcoming.map((item) => (
                      <InterestCard key={item.eventId} item={item} inactive={false} onRemoved={() => remove(item.eventId)} />
                    ))}
                  </Grid>
                  <Pagination page={upcomingPage} pageCount={upcomingPageCount} onPageChange={setUpcomingPage} totalItems={upcoming.length} pageSize={PAGE_SIZE} />
                </>
              )}
            </Section>

            {inactive.length > 0 && (
              <Section label={`Passés ou indisponibles ${inactive.length}`}>
                <Grid>
                  {pagedInactive.map((item) => (
                    <InterestCard key={item.eventId} item={item} inactive onRemoved={() => remove(item.eventId)} />
                  ))}
                </Grid>
                <Pagination page={inactivePage} pageCount={inactivePageCount} onPageChange={setInactivePage} totalItems={inactive.length} pageSize={PAGE_SIZE} />
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2>{label}</h2>
      {children}
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}

function InterestCard({ item, inactive, onRemoved }: { item: EventInterestItemView; inactive: boolean; onRemoved: () => void }) {
  const ev = item.event
  const addedDate = new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  const priceLabel = !ev
    ? null
    : ev.minPrice === null
      ? 'Voir les places'
      : ev.minPrice === 0
        ? 'Gratuit'
        : `dès ${fmtMoney(ev.minPrice, ev.currency)}`

  const card = (
    <Card
      className={ev ? 'lb-card' : undefined}
      style={{ padding: 0, overflow: 'hidden', opacity: inactive ? 0.72 : 1, cursor: ev ? 'pointer' : 'default', position: 'relative' }}
    >
      <div className={styles.image} style={{ background: 'var(--surface-3)' }}>
        {ev && (
          <Image src={ev.imageUrl || placeholderPhotoUrl(ev.id, 720, 440)} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 50vw" />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(var(--media-black-rgb), .85), transparent 60%)' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {ev?.category && <Badge color="var(--image-text)" bg="rgba(var(--black-rgb), .42)">{ev.category}</Badge>}
          {inactive && <Badge color="var(--danger-ink)" bg="var(--danger)">Indisponible</Badge>}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }} onClick={(e) => e.stopPropagation()}>
          <EventInterestButtonClient eventId={item.eventId} initialInterested onChange={(interested) => !interested && onRemoved()} isAuthenticated floating compact />
        </div>
        {ev && (
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
            <p style={{ fontSize: 'var(--font-size-title-3)', fontWeight: 820, margin: 0, color: 'var(--image-text)', lineHeight: 1.2 }}>{ev.name}</p>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--image-text-muted)', margin: '5px 0 0' }}>
              {[ev.dateDisplay || ev.date, ev.time, ev.city].filter(Boolean).join(' · ') || 'Date à confirmer'}
            </p>
          </div>
        )}
      </div>
      <div style={{ minHeight: 54, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 'var(--font-size-callout)', color: 'var(--text-faint)' }}>Ajouté le {addedDate}</span>
        {priceLabel && <span style={{ fontSize: 'var(--font-size-body-sm)', fontWeight: 750, color: 'var(--gold)' }}>{priceLabel}</span>}
      </div>
    </Card>
  )

  return ev ? (
    <Link href={`/events/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {card}
    </Link>
  ) : (
    card
  )
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ fontSize: 'var(--font-size-caption-2-lg)', fontWeight: 700, padding: '3px 9px', borderRadius: 999, color, background: bg }}>{children}</span>
}
