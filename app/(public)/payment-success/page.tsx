import PaymentSuccessClient from '@/app/components/features/account/PaymentSuccessClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'État du paiement — LIVEINBLACK', robots: { index: false, follow: false } }

export const dynamic = 'force-dynamic'

// Cible de app/api/checkout/fedapay/route.ts (callbackUrl, FedaPay : FedaPay ajoute
// lui-même ?id=&status=&close= sur ce retour unique — succès ET abandon), et
// app/components/EventCheckoutPanel.tsx pour une place gratuite (rail 'free' —
// redirection CLIENT directe, billet déjà émis synchrone par
// app/api/checkout/free/route.ts : ?order_id=&free=true, jamais de session_id
// ni d'id FedaPay). En V1, un session_id historique n'est plus relu ici :
// seuls FedaPay et les billets gratuits peuvent confirmer une commande.
export default async function PaiementReussiPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; id?: string; status?: string; close?: string; order_id?: string; free?: string; cancelled?: string; event_id?: string }>
}) {
  const params = await searchParams
  const sessionId = null
  const fedapayTxnId = !sessionId ? params.id || null : null
  const fedapayClose = params.close === 'true'
  // order_id ne compte comme identifiant "billet gratuit" que si ni session_id
  // ni id FedaPay ne sont là ET que le flag free=true est explicitement posé.
  const freeOrderId = !sessionId && !fedapayTxnId && params.free === 'true' ? params.order_id || null : null
  const historicalCancelledEventId = !sessionId && !fedapayTxnId && !freeOrderId && params.cancelled === '1' ? params.event_id || null : null

  return (
    <PaymentSuccessClient
      sessionId={sessionId}
      fedapayTxnId={fedapayTxnId}
      fedapayClose={fedapayClose}
      freeOrderId={freeOrderId}
      historicalCancelledEventId={historicalCancelledEventId}
    />
  )
}
