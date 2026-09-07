'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fmtMoney } from '@/lib/shared/money'
import { Button, Card } from '@/app/components/ui'
import type { OrderItem, OrderItemStatus } from './commanderUtils'

export interface CommanderClientProps {
  eventName: string
  ticketCode: string
  currency: string
  initialItems: OrderItem[]
}

const STATUS_LABELS: Record<OrderItemStatus, string> = {
  sent: 'En attente de remise',
  served: 'Servi',
  cancelled: 'Annulé',
}

export default function CommanderClient({ eventName, ticketCode, currency, initialItems }: CommanderClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <main className="lb-operational-shell">
      <div className="lb-operational-workspace">
        <Link href="/profile">Retour à Mes billets</Link>
        <header>
          <h1>Mes consommations</h1>
          <p style={{ color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{eventName} · Billet {ticketCode}</p>
          <p>Les consommations se précommandent uniquement lors de l&apos;achat du billet. Tu peux consulter ici leur suivi, sans ajouter de commande.</p>
        </header>
        <Button
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          loadingText="Actualisation…"
          onClick={() => startTransition(() => router.refresh())}
        >
          Actualiser le suivi
        </Button>
        <section aria-label="Suivi des consommations" aria-busy={isPending}>
          {initialItems.length === 0 ? (
            <Card style={{ padding: 20 }}>
              <p>Aucune consommation enregistrée pour ce billet.</p>
            </Card>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
              {initialItems.map((item) => (
                <li key={item.id}>
                  <Card style={{ padding: 18, overflowWrap: 'anywhere' }}>
                    <h2 style={{ fontSize: 'var(--font-size-callout)', margin: '0 0 8px' }}>{item.name} × {item.quantity}</h2>
                    <p style={{ margin: '0 0 8px' }}>
                      {item.kind === 'included' ? 'Inclus dans le billet' : fmtMoney(item.unitPriceMinor * item.quantity, currency)}
                      {item.kind === 'preorder' && ' · Précommandé avec le billet'}
                      {item.kind === 'order' && ' · Commande historique'}
                    </p>
                    <p style={{ margin: 0 }}>{STATUS_LABELS[item.status]}</p>
                    {item.showLabel && <p>{item.showLabel}{item.showInfo ? ` · ${item.showInfo}` : ''}</p>}
                    {item.cancellationReason && <p>Motif : {item.cancellationReason}</p>}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p style={{ color: 'var(--text-muted)' }}>Une ligne annulée ne confirme pas un remboursement. Consulte ton dossier de remboursement pour son état.</p>
      </div>
    </main>
  )
}
