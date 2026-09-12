'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { OrganizerEventView } from '../my-events/types'
import { formatMoney } from '../my-events/types'
import type { PayoutStatusView } from '@/lib/server/organizer/organizerPayoutsUtils'
import { Button, Card } from '@/app/components/ui'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  TrendingUp,
  Ticket,
  Wallet,
  CalendarDays,
  ArrowUpRight,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
} from 'lucide-react'

export interface DashboardClientProps {
  events: OrganizerEventView[]
  payoutStatus: PayoutStatusView | null
  momos: Record<string, string>
  userName: string
}

const PIE_COLORS = [
  '#d7447e', // Rose primaire
  '#f59e0b', // Ambre / Or
  '#3b82f6', // Bleu
  '#10b981', // Émeraude
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
]

export default function DashboardClient({
  events,
  payoutStatus,
  momos,
  userName,
}: DashboardClientProps) {
  const [activeRange, setActiveRange] = useState<'all' | 'upcoming' | 'past'>('all')

  const now = useMemo(() => Date.now(), [])

  // Calculs financiers globaux
  const totalRevenue = useMemo(() => {
    return events
      .filter((e) => e.currency === 'XOF' && !e.cancelled)
      .reduce((sum, e) => sum + e.revenue, 0)
  }, [events])

  const totalTicketsIssued = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.cancelled ? 0 : e.ticketCount), 0)
  }, [events])

  const totalSoldTickets = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.cancelled ? 0 : e.soldCount), 0)
  }, [events])

  const totalCapacity = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.cancelled ? 0 : e.totalCapacity), 0)
  }, [events])

  const averageOccupancy = useMemo(() => {
    if (totalCapacity === 0) return 0
    return Math.min(100, Math.round((totalSoldTickets / totalCapacity) * 100))
  }, [totalCapacity, totalSoldTickets])

  const upcomingEvents = useMemo(() => {
    return events.filter(
      (e) => !e.cancelled && new Date(`${e.date}T${e.time || '23:59'}`).getTime() >= now
    )
  }, [events, now])

  const pastEvents = useMemo(() => {
    return events.filter(
      (e) => !e.cancelled && new Date(`${e.date}T${e.time || '23:59'}`).getTime() < now
    )
  }, [events, now])

  // Données pour le bar chart (Revenus par événement)
  const revenueChartData = useMemo(() => {
    const list = activeRange === 'upcoming' ? upcomingEvents : activeRange === 'past' ? pastEvents : events
    return list
      .filter((e) => !e.cancelled)
      .slice(0, 8)
      .map((e) => ({
        name: e.name.length > 14 ? `${e.name.slice(0, 14)}…` : e.name,
        fullName: e.name,
        revenu: e.revenue,
        billets: e.soldCount,
      }))
  }, [events, upcomingEvents, pastEvents, activeRange])

  // Données pour le Donut Chart (Répartition des ventes par localisation / ville)
  const categoryDonutData = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      if (e.cancelled) continue
      const cat = e.city || 'Autres'
      map.set(cat, (map.get(cat) || 0) + (e.soldCount || 1))
    }
    const data = Array.from(map.entries()).map(([name, value]) => ({ name, value }))
    return data.length > 0 ? data : [{ name: 'Événements', value: 1 }]
  }, [events])

  // Donut Remplissage Global (Vendus vs Places restantes)
  const fillDonutData = useMemo(() => {
    const remaining = Math.max(0, totalCapacity - totalSoldTickets)
    return [
      { name: 'Billets vendus', value: totalSoldTickets || 1 },
      { name: 'Places restantes', value: remaining || 1 },
    ]
  }, [totalCapacity, totalSoldTickets])

  return (
    <main className="lb-dashboard-page" style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Header unifié avec titre, sous-titre et bouton d'action spécial */}
      <header
        className="lb-dashboard-page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1 className="lb-dashboard-title" style={{ margin: 0 }}>
            Tableau de bord
          </h1>
          <p className="lb-dashboard-description" style={{ marginTop: 6, maxWidth: 680 }}>
            Vue panoramique en temps réel de vos revenus, de votre billetterie et de la performance de vos soirées.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            href="/my-events?event=new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 'var(--radius-control)',
              background: 'var(--primary)',
              color: 'var(--primary-ink)',
              fontWeight: 700,
              fontSize: 'var(--font-size-footnote-lg)',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(215, 68, 126, 0.28)',
            }}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Créer un événement</span>
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        <Card
          style={{
            padding: '20px 22px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Revenus générés
            </span>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-a12)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'clamp(24px, 2.2vw, 32px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
              {formatMoney(totalRevenue, 'XOF')}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-footnote)', color: 'var(--text-faint)' }}>
              Billetterie nette & précommandes
            </p>
          </div>
        </Card>

        <Card
          style={{
            padding: '20px 22px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Billets émis & vendus
            </span>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', display: 'grid', placeItems: 'center', color: '#f59e0b' }}>
              <Ticket size={18} />
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'clamp(24px, 2.2vw, 32px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
              {totalSoldTickets} <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalTicketsIssued || totalCapacity}</span>
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-footnote)', color: 'var(--text-faint)' }}>
              {events.length} soirée{events.length > 1 ? 's' : ''} programmée{events.length > 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        <Card
          style={{
            padding: '20px 22px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Taux de remplissage
            </span>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', display: 'grid', placeItems: 'center', color: '#3b82f6' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'clamp(24px, 2.2vw, 32px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
              {averageOccupancy}%
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-footnote)', color: 'var(--text-faint)' }}>
              Moyenne générale sur les jauges
            </p>
          </div>
        </Card>

        <Card
          style={{
            padding: '20px 22px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Statut Encaissement
            </span>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', display: 'grid', placeItems: 'center', color: '#10b981' }}>
              <Wallet size={18} />
            </span>
          </div>
          <div>
            <span style={{ fontSize: 'clamp(20px, 1.8vw, 24px)', fontWeight: 700, color: 'var(--text)' }}>
              {momos.bj ? 'Mobile Money Actif' : payoutStatus?.chargesEnabled ? 'Stripe Connecté' : 'À configurer'}
            </span>
            <p style={{ margin: '6px 0 0', fontSize: 'var(--font-size-footnote)' }}>
              <Link href="/organizer-studio?tab=paiements" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Gérer mes encaissements →
              </Link>
            </p>
          </div>
        </Card>
      </section>

      {/* Charts Section: Graphiques barres/courbes et Donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* Graphique des revenus par événement */}
        <Card style={{ padding: '22px 24px', borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-headline)', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Évolution des revenus par soirée
              </h2>
              <p style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Recettes brutes cumulées en Francs CFA (XOF)
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
              {(['all', 'upcoming', 'past'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRange(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 7,
                    border: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeRange === r ? 'var(--primary)' : 'transparent',
                    color: activeRange === r ? 'var(--primary-ink)' : 'var(--text-muted)',
                  }}
                >
                  {r === 'all' ? 'Toutes' : r === 'upcoming' ? 'À venir' : 'Passées'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            {revenueChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                Aucune donnée à afficher pour cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-faint)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-faint)" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-2)', borderColor: 'var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 }}
                    formatter={(val) => [`${Number(val || 0).toLocaleString()} FCFA`, 'Recettes']}
                  />
                  <Bar dataKey="revenu" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Donut Chart: Remplissage et Catégories */}
        <Card style={{ padding: '22px 24px', borderRadius: 'var(--radius-card)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 'var(--font-size-headline)', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
            Répartition par catégorie & jauge
          </h2>
          <p style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Part des billets écoulés selon l’ambiance et l’état du stock
          </p>

          <div style={{ width: '100%', height: 200, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-2)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }}
                  formatter={(val) => [`${val} billets`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ display: 'block', fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {totalSoldTickets}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Vendus
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {categoryDonutData.map((entry, idx) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{entry.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Liste des soirées récentes & KPIs d'avancement */}
      <section style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-headline)', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              État d&rsquo;avancement des soirées
            </h2>
            <p style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Suivi détaillé des ventes et des capacités en temps réel
            </p>
          </div>
          <Link
            href="/my-events"
            style={{
              fontSize: 'var(--font-size-footnote)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Voir toute la programmation <ArrowUpRight size={15} />
          </Link>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {events.slice(0, 5).map((event) => {
            const fill = event.totalCapacity > 0 ? Math.min(100, Math.round((event.soldCount / event.totalCapacity) * 100)) : 0
            const isPast = new Date(`${event.date}T${event.time || '23:59'}`).getTime() < now
            return (
              <Card
                key={event.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--surface-2)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--text)' }}>
                      {event.name}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)' }}>
                      {event.dateDisplay || event.date} · {event.city}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ minWidth: 160, flex: 1, maxWidth: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-faint)' }}>Remplissage</span>
                    <strong style={{ color: fill >= 85 ? 'var(--primary)' : 'var(--gold)' }}>{fill}%</strong>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${fill}%`, height: '100%', borderRadius: 999, background: fill >= 85 ? 'var(--primary)' : '#f59e0b' }} />
                  </div>
                </div>

                {/* Chiffre d'affaires & statut */}
                <div style={{ textAlign: 'right', minWidth: 130 }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-size-headline)', fontWeight: 700, color: 'var(--text)' }}>
                    {formatMoney(event.revenue, 'XOF')}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: event.cancelled ? 'var(--danger)' : isPast ? 'var(--text-faint)' : 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {event.cancelled ? 'Annulé' : isPast ? 'Terminé' : 'En billetterie'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}
