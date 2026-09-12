'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Mascot, Button, SlideOverModal } from '@/app/components/ui'
import CameraScanner from '../scanner/[eventId]/CameraScanner'
import { resolveScanInput, resolveTicketCodeForLookup } from '../scanner/[eventId]/scannerUtils'
import { fmtMoney } from '@/lib/shared/money'
import styles from './my-shifts.module.css'
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react'

export interface StaffedEventItem {
  eventId: string
  eventName: string
  dateDisplay: string | null
  city: string | null
  role: string
  live: boolean
  started: boolean
}

interface ScanDrawerState {
  eventId: string
  eventName: string
}

const ROLE_META: Record<string, { label: string; color: string; soft: string; border: string; desc: string }> = {
  serveur: { label: 'Serveur', color: 'var(--primary)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Prends et sers les commandes au bar' },
  scan: { label: 'Contrôle entrée', color: 'var(--violet-text)', soft: 'rgba(var(--violet-rgb), .12)', border: 'var(--violet-border)', desc: "Scanne les billets à l'entrée" },
  manager: { label: 'Manager', color: 'var(--gold)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Gestion complète de la soirée' },
  dj: { label: 'DJ', color: 'var(--danger)', soft: 'var(--danger-fill)', border: 'var(--danger-border)', desc: 'Gère la playlist interactive de la soirée' },
  vendeur: { label: 'Vente sur place', color: 'var(--gold)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: 'Vends des billets cash ou Mobile Money' },
  owner: { label: 'Organisateur', color: 'var(--primary)', soft: 'var(--primary-a12)', border: 'var(--primary-a35)', desc: "Ton événement — ouvre le scan pour contrôler l'entrée" },
}
const FALLBACK_ROLE_META = { label: '', color: 'var(--text-faint)', soft: 'var(--fill-secondary)', border: 'var(--border)', desc: '' }

export default function MyShiftsClient({ events }: { events: StaffedEventItem[] }) {
  const [scanDrawer, setScanDrawer] = useState<ScanDrawerState | null>(null)
  const [cameraActive, setCameraActive] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string; ticket?: any } | null>(null)

  async function handleCheckin(rawCode: string) {
    if (!scanDrawer || !rawCode.trim() || scanning) return
    setScanning(true)
    setScanResult(null)
    try {
      const input = resolveScanInput(rawCode.trim())
      const res = await fetch('/api/tickets/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, eventId: scanDrawer.eventId }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setScanResult({
          ok: false,
          message: data.error === 'already_checked_in' ? 'Ce billet a déjà été validé à l’entrée.' : 'Billet invalide ou introuvable.',
        })
      } else {
        setScanResult({
          ok: true,
          message: data.alreadyCheckedIn ? 'Déjà entré' : 'Entrée validée avec succès',
          ticket: data.ticket,
        })
        setManualCode('')
      }
    } catch {
      setScanResult({ ok: false, message: 'Erreur réseau — vérifie ta connexion.' })
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="lb-dashboard-page lb-dashboard-page--medium">
      <div>
        <header className="lb-dashboard-page-header">
          <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 'clamp(26px,3.2vw,34px)', fontWeight: 720, letterSpacing: '-.045em' }}>
            Mes soirées
          </h1>
          <p style={{ maxWidth: 650, margin: '7px 0 0', color: 'var(--text-faint)', fontSize: 'var(--font-size-callout)', lineHeight: 1.42 }}>
            Accède aux événements pour lesquels tu fais partie de l’équipe ou contrôle les entrées en direct.
          </p>
        </header>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Mascot mood="sleeping" size={250} />
            <p style={{ fontWeight: 700, fontSize: 'var(--font-size-headline-lg)', color: 'var(--text)', margin: 0 }}>
              Aucune soirée pour l&apos;instant
            </p>
            <p style={{ fontSize: 'var(--font-size-footnote-lg)', color: 'var(--text-muted)', margin: 0, maxWidth: 340, lineHeight: 1.45 }}>
              Quand un organisateur t&apos;ajoute à l&apos;équipe d&apos;une soirée ou dès que tu crées un événement, elle apparaît ici.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {events.map((ev) => {
              const meta = ROLE_META[ev.role] ? ROLE_META[ev.role] : { ...FALLBACK_ROLE_META, label: ev.role }
              const dateLine = [ev.dateDisplay, ev.city].filter(Boolean).join(' · ')
              const isScanRole = ev.role === 'scan' || ev.role === 'owner'

              return (
                <Card key={ev.eventId} accent={ev.live ? meta.border : undefined} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div style={{ minWidth: 0 }}>
                      <p className={styles.eventName}>{ev.eventName || 'Événement'}</p>
                      {dateLine && <p className={styles.date}>{dateLine}</p>}
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 'var(--font-size-caption)',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: meta.color,
                        background: meta.soft,
                        border: `1px solid ${meta.border}`,
                        borderRadius: 'var(--radius-control)',
                        padding: '4px 10px',
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className={styles.statusRow}>
                    {ev.live ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-caption-lg)', fontWeight: 700, color: meta.color }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} /> En cours
                      </span>
                    ) : ev.started ? (
                      <span style={{ fontSize: 'var(--font-size-caption-lg)', color: 'var(--text-faint)' }}>Soirée terminée</span>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-caption-lg)', color: 'var(--text-faint)' }}>À venir</span>
                    )}
                    <span className={styles.description}>{meta.desc}</span>
                  </div>

                  {isScanRole ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setScanDrawer({ eventId: ev.eventId, eventName: ev.eventName })
                        setScanResult(null)
                        setCameraActive(true)
                      }}
                      className={styles.action}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 44,
                        borderRadius: 'var(--radius-control)',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <ScanLine size={17} />
                      <span>Ouvrir le scan des entrées</span>
                    </Button>
                  ) : (
                    <Link
                      href={ev.role === 'dj' ? `/playlist/${ev.eventId}` : ev.role === 'vendeur' ? `/on-site-sales/${ev.eventId}` : `/scanner/${ev.eventId}`}
                      className={styles.action}
                    >
                      {ev.role === 'dj' ? 'Gérer la playlist' : ev.role === 'vendeur' ? 'Ouvrir la vente sur place' : 'Ouvrir le POS bar'}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* SlideOver Drawer latéral pour le scan des entrées */}
      {scanDrawer && (
        <SlideOverModal
          onClose={() => {
            setScanDrawer(null)
            setCameraActive(false)
          }}
          title="Contrôle des entrées"
          subtitle={scanDrawer.eventName}
          padded
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Carré caméra temps réel en haut */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  Caméra en temps réel
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCameraActive((v) => !v)}
                  style={{ fontSize: 12, padding: '2px 8px' }}
                >
                  {cameraActive ? 'Mettre en pause' : 'Activer'}
                </Button>
              </div>

              {/* Rendu caméra carré centré propre */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxHeight: 340,
                  margin: '0 auto',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '2px solid var(--border-strong)',
                  background: 'var(--media-canvas)',
                  position: 'relative',
                }}
              >
                <CameraScanner active={cameraActive} onScan={(code) => void handleCheckin(code)} />
              </div>
            </div>

            {/* Saisie manuelle du code billet */}
            <div>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Saisie manuelle du code
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleCheckin(manualCode)
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="EX: LIB-123456"
                  style={{
                    flex: 1,
                    minHeight: 44,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 15,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!manualCode.trim() || scanning}
                  loading={scanning}
                  loadingText="…"
                  style={{ minHeight: 44, padding: '0 18px', borderRadius: 'var(--radius-control)' }}
                >
                  Valider
                </Button>
              </form>
            </div>

            {/* Résultat du scan */}
            {scanResult && (
              <Card
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${scanResult.ok ? 'var(--primary-a35)' : 'var(--danger-border)'}`,
                  background: scanResult.ok ? 'var(--primary-a08)' : 'var(--danger-fill)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {scanResult.ok ? (
                  <CheckCircle2 size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={24} color="var(--pink)" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <strong style={{ display: 'block', fontSize: 15, color: scanResult.ok ? 'var(--primary)' : 'var(--pink)' }}>
                    {scanResult.message}
                  </strong>
                  {scanResult.ticket && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      {scanResult.ticket.place} · {fmtMoney(scanResult.ticket.totalPrice, scanResult.ticket.currency)}
                      {scanResult.ticket.holderName ? ` · ${scanResult.ticket.holderName}` : ''}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </SlideOverModal>
      )}
    </main>
  )
}
