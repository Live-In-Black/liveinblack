'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowUpRight, CalendarCheck2, FileCheck2, ShieldAlert, TicketCheck, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import { fmtMoney } from '@/lib/shared/money'
import { Button, Card, Skeleton } from '@/app/components/ui'
import { DonutChart } from '@/app/components/ui/charts/DonutChart'
import { LineChartCard } from '@/app/components/ui/charts/LineChartCard'
import styles from './AgentDashboardClient.module.css'

// Port de la section « Métriques business » + « Communauté » de l'onglet
// Tableau de bord de src/pages/AgentPage.jsx (tab === 'dashboard', #101 phase
// agent/admin). Voir lib/server/agentDashboard.ts pour le détail des sources
// et des différences volontaires avec le legacy (billets/GMV recalculés
// depuis Order+Ticket plutôt que depuis des `bookings/{id}` Firestore déjà
// agrégés, fenêtre « en ligne » alignée sur le heartbeat de présence de cette
// migration).
//
// Volontairement absent ici (appartient à d'autres panneaux, #99) :
// « Emails non vérifiés », « Doublons », « Inscriptions récentes » — ces
// sections legacy listent et modifient des comptes individuels, ce qui est
// le terrain de la gestion de comptes agent, pas d'un panneau de stats en
// lecture seule.

interface DashboardStats {
  revenue: {
    platformRevenueEUR: number
    platformRevenueXOF: number
    ticketFeeRevenueEUR: number
    ticketFeeRevenueXOF: number
    gmvBoosts: number
    gmvTicketsEUR: number
    gmvTicketsXOF: number
  }
  tickets: { totalSold: number; recentSold30d: number }
  events: { totalPublished: number; upcoming: number }
  community: {
    totalUsers: number
    totalOnline: number
    totalPrestataires: number
    totalOrganisateurs: number
    pendingDossiers: number
    newAccountsThisMonth: number
  }
  signupsLast30Days: { date: string; count: number }[]
  roleBreakdown: { role: 'client' | 'organisateur' | 'prestataire'; count: number }[]
  updatedAt: string
}

const ROLE_LABEL: Record<DashboardStats['roleBreakdown'][number]['role'], string> = {
  client: 'Client',
  organisateur: 'Organisateur',
  prestataire: 'Prestataire',
}
const ROLE_COLOR: Record<DashboardStats['roleBreakdown'][number]['role'], string> = {
  client: 'var(--primary)',
  organisateur: 'var(--gold)',
  prestataire: 'var(--danger)',
}

function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function AgentDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error('load_failed')
      setStats(data.stats)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/admin/dashboard')
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error('load_failed')
        if (!cancelled) setStats(data.stats)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="lb-dashboard-page lb-agent-screen lb-agent-screen--overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <Card accent="var(--danger-border)" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: 'var(--font-size-callout)', color: 'var(--text-muted)', margin: 0 }}>Lecture impossible. Recharge la page ; si ça persiste, reconnecte-toi (droits agent).</p>
            <Button variant="secondary" onClick={load} style={{ fontSize: 'var(--font-size-footnote-lg)' }}>
              Recharger
            </Button>
          </Card>
        )}

        {loading || !stats ? (
          <AgentDashboardSkeleton />
        ) : (
          <>
            <section className={styles.prioritySection} aria-labelledby="priority-title">
              <div className={styles.sectionHeading}>
                <div><span className={styles.sectionIndex}>01</span><h2 id="priority-title">À traiter maintenant</h2></div>
                <p>Les accès les plus utiles pour votre prochain geste.</p>
              </div>
              <div className={styles.actionGrid}>
                <Link href="/agent/dossiers" className={`${styles.action} ${styles.actionPrimary}`}>
                  <span className={styles.actionIcon}><FileCheck2 size={22} aria-hidden="true" /></span>
                  <span className={styles.actionBody}><strong>{stats.community.pendingDossiers}</strong><span>Dossiers en attente</span><small>Vérifier les profils et statuer</small></span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
                <Link href="/agent/signalements" className={styles.action}>
                  <span className={styles.actionIcon}><ShieldAlert size={22} aria-hidden="true" /></span>
                  <span className={styles.actionBody}><strong>Confiance</strong><span>File de modération</span><small>Qualifier les alertes ouvertes</small></span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
                <Link href="/agent/paiements" className={styles.action}>
                  <span className={styles.actionIcon}><WalletCards size={22} aria-hidden="true" /></span>
                  <span className={styles.actionBody}><strong>{fmtMoney(stats.revenue.platformRevenueXOF, 'XOF')}</strong><span>Contrôle financier</span><small>Suivre les flux et les commissions</small></span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
                <Link href="/agent/evenements" className={styles.action}>
                  <span className={styles.actionIcon}><CalendarCheck2 size={22} aria-hidden="true" /></span>
                  <span className={styles.actionBody}><strong>{stats.events.upcoming}</strong><span>Événements à venir</span><small>Superviser le catalogue publié</small></span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section className={styles.pulseSection} aria-labelledby="pulse-title">
              <div className={styles.sectionHeading}>
                <div><span className={styles.sectionIndex}>02</span><h2 id="pulse-title">Pouls du jour</h2></div>
                <p>Les signaux essentiels, sans bruit.</p>
              </div>
              <div className={styles.pulseRail}>
                <div className={styles.pulseItem}><span className={styles.pulseIcon}><Activity size={19} /></span><div><strong>{stats.community.totalOnline}</strong><span>en ligne maintenant</span></div></div>
                <div className={styles.pulseItem}><span className={styles.pulseIcon}><TicketCheck size={19} /></span><div><strong>{stats.tickets.recentSold30d}</strong><span>billets sur 30 jours</span></div></div>
                <div className={styles.pulseItem}><span className={styles.pulseIcon}><CalendarCheck2 size={19} /></span><div><strong>{stats.events.upcoming}</strong><span>événements à venir</span></div></div>
                <div className={styles.pulseItem}><span className={styles.pulseIcon}><UsersRound size={19} /></span><div><strong>+{stats.community.newAccountsThisMonth}</strong><span>nouveaux comptes</span></div></div>
              </div>
            </section>

            <section className={styles.overviewSection} aria-labelledby="overview-title">
              <div className={styles.sectionHeading}>
                <div><span className={styles.sectionIndex}>03</span><h2 id="overview-title">Vue stratégique</h2></div>
                <p>Revenus, activité et composition de l’écosystème.</p>
              </div>
              <div className={styles.bentoGrid}>
                <Card className={styles.revenueCard}>
                  <div className={styles.cardTop}><span>Revenu plateforme</span><TrendingUp size={20} /></div>
                  <strong className={styles.heroValue}>{fmtMoney(stats.revenue.platformRevenueXOF, 'XOF')}</strong>
                  <div className={styles.revenueBreakdown}>
                    <div><span>Frais de billetterie</span><strong>{fmtMoney(stats.revenue.ticketFeeRevenueXOF, 'XOF')}</strong></div>
                    <div><span>Boosts</span><strong>{fmtMoney(stats.revenue.gmvBoosts, 'XOF')}</strong></div>
                  </div>
                </Card>

                <Card className={styles.volumeCard}>
                  <div className={styles.cardTop}><span>Volume commercial</span><WalletCards size={20} /></div>
                  <strong className={styles.largeValue}>{fmtMoney(stats.revenue.gmvTicketsXOF + stats.revenue.gmvBoosts, 'XOF')}</strong>
                  <div className={styles.compactStat}><span>Billets payés</span><strong>{stats.tickets.totalSold}</strong></div>
                </Card>

                <Card className={styles.ecosystemCard}>
                  <div className={styles.cardTop}><span>Écosystème</span><UsersRound size={20} /></div>
                  <div className={styles.ecosystemTotal}><strong>{stats.community.totalUsers}</strong><span>comptes actifs dans la plateforme</span></div>
                  <div className={styles.roleRows}>
                    <div><span>Prestataires</span><strong>{stats.community.totalPrestataires}</strong></div>
                    <div><span>Organisateurs</span><strong>{stats.community.totalOrganisateurs}</strong></div>
                    <div><span>Événements publiés</span><strong>{stats.events.totalPublished}</strong></div>
                  </div>
                </Card>
              </div>
            </section>

            <section className={styles.insightsSection} aria-labelledby="insights-title">
              <div className={styles.sectionHeading}>
                <div><span className={styles.sectionIndex}>04</span><h2 id="insights-title">Tendances</h2></div>
                <p>Comprendre la progression et l’équilibre de la communauté.</p>
              </div>
              <div className={styles.insightsGrid}>
                <Card className={styles.chartCard}>
                  <div className={styles.chartHeading}><div><span>Acquisition</span><strong>Nouveaux comptes</strong></div><span className={styles.delta}>+{stats.community.newAccountsThisMonth} ce mois</span></div>
                  <LineChartCard data={stats.signupsLast30Days.map((d) => ({ date: d.date, value: d.count }))} formatDate={fmtDay} height={180} />
                </Card>
                <Card className={styles.chartCard}>
                  <div className={styles.chartHeading}><div><span>Répartition</span><strong>Profils de la communauté</strong></div><span className={styles.totalPill}>{stats.community.totalUsers} total</span></div>
                  <DonutChart data={stats.roleBreakdown.map((r) => ({ label: ROLE_LABEL[r.role], value: r.count, color: ROLE_COLOR[r.role] }))} size={160} />
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function AgentDashboardSkeleton() {
  return (
    <div aria-label="Chargement du tableau de bord" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section className={styles.prioritySection}>
        <div className={styles.sectionHeading}>
          <div><Skeleton width={32} height={12} /><Skeleton width={210} height={24} style={{ marginTop: 8 }} /></div>
          <Skeleton width={260} height={12} />
        </div>
        <div className={styles.actionGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${styles.action}${i === 0 ? ` ${styles.actionPrimary}` : ''}`}>
              <Skeleton width={44} height={44} radius={14} style={{ flexShrink: 0 }} />
              <span className={styles.actionBody}>
                <Skeleton width={i === 0 ? 58 : 96} height={28} />
                <Skeleton width={150} height={13} />
                <Skeleton width={190} height={11} />
              </span>
              <Skeleton width={19} height={19} radius={9} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.pulseSection}>
        <div className={styles.sectionHeading}>
          <div><Skeleton width={32} height={12} /><Skeleton width={150} height={24} style={{ marginTop: 8 }} /></div>
          <Skeleton width={210} height={12} />
        </div>
        <div className={styles.pulseRail}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.pulseItem}>
              <Skeleton width={38} height={38} radius={13} />
              <div style={{ minWidth: 0, flex: 1 }}><Skeleton width={52 + i * 10} height={20} /><Skeleton width="70%" height={11} style={{ marginTop: 6 }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.overviewSection}>
        <div className={styles.bentoGrid}>
          <Card className={styles.revenueCard}><Skeleton width={160} height={14} /><Skeleton width="68%" height={42} style={{ marginTop: 18 }} /><Skeleton width="100%" height={72} radius={16} style={{ marginTop: 18 }} /></Card>
          <Card className={styles.volumeCard}><Skeleton width={145} height={14} /><Skeleton width="72%" height={34} style={{ marginTop: 18 }} /><Skeleton width="100%" height={58} radius={14} style={{ marginTop: 18 }} /></Card>
          <Card className={styles.ecosystemCard}><Skeleton width={120} height={14} /><Skeleton width="58%" height={36} style={{ marginTop: 18 }} /><Skeleton width="100%" height={118} radius={16} style={{ marginTop: 18 }} /></Card>
        </div>
      </section>

      <section className={styles.insightsSection}>
        <div className={styles.insightsGrid}>
          <Card className={styles.chartCard}><Skeleton width={190} height={18} /><Skeleton width="100%" height={180} radius={18} style={{ marginTop: 18 }} /></Card>
          <Card className={styles.chartCard}><Skeleton width={210} height={18} /><Skeleton width={160} height={160} radius={80} style={{ margin: '18px auto 0' }} /></Card>
        </div>
      </section>
    </div>
  )
}
