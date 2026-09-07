import { describe, expect, it } from 'vitest'
import { clientRefundEligibility } from '../refunds/clientEligibility'
import { refundRequestCreatedEmail } from '../emails'

const now = new Date('2026-09-06T12:00:00Z')
const order = { status: 'paid', paid: true, rail: 'fedapay', currency: 'XOF', cancellationProtectionPurchased: true, cancellationProtectionFeeMinor: 1000 }
const event = { cancelled: false, closingDate: new Date('2026-09-08T12:00:00Z') }

describe('droits de remboursement et notification de demande', () => {
  it('ferme exactement a fermeture moins 48 heures', () => {
    expect(clientRefundEligibility(order, event, now)).toMatchObject({ ok: false })
    expect(clientRefundEligibility(order, event, new Date(now.getTime() - 1))).toEqual({ ok: true, cause: 'cancellation_option' })
  })
  it('ferme le refus de report a la limite exacte', () => {
    const postponed = { ...event, postponedFrom: { date: '2026-09-01' }, refundWindowClosesAt: now }
    expect(clientRefundEligibility(order, postponed, now)).toMatchObject({ error: 'refund_window_closed' })
    expect(clientRefundEligibility(order, postponed, new Date(now.getTime() - 1))).toEqual({ ok: true, cause: 'postponed_declined' })
  })
  it('ne supprime pas une option encore valide apres la fenetre du report', () => {
    expect(clientRefundEligibility(order, { ...event, closingDate: new Date('2026-09-10T12:00:00Z'), postponedFrom: {}, refundWindowClosesAt: now }, now)).toEqual({ ok: true, cause: 'cancellation_option' })
  })
  it('exige le paiement confirme de la commande', () => {
    expect(clientRefundEligibility({ ...order, paid: false }, event, now)).toMatchObject({ error: 'order_not_paid' })
  })
  it('annonce un dossier et non un versement, avec les informations de retrait echappees', () => {
    const email = refundRequestCreatedEmail('Soiree', '11 500 FCFA', { code: 'SECRET', point: '<Point>', address: 'Cotonou' })
    expect(email.subject).toContain('Demande de remboursement enregistrée')
    expect(email.html).toContain('Aucun versement n’est confirmé')
    expect(email.html).toContain('SECRET')
    expect(email.html).toContain('&lt;Point&gt;')
    expect(email.inApp?.body).not.toContain('SECRET')
  })
})
