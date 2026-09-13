import { describe, it, expect } from 'vitest'
import { computePayoutGapLabel } from '../organizerPayoutGaps'

describe('computePayoutGapLabel', () => {
  it("renvoie une chaîne vide quand tout l'encaissement est configuré", () => {
    const label = computePayoutGapLabel(
      [{ currency: 'XOF', region: 'Bénin', cancelled: false }],
      { legacyCardPayoutReady: false, momos: { bj: '+2290197000000' } }
    )
    expect(label).toBe('')
  })

  it('ignore les événements annulés', () => {
    const label = computePayoutGapLabel(
      [{ currency: 'EUR', region: 'France', cancelled: true }],
      { legacyCardPayoutReady: false, momos: {} }
    )
    expect(label).toBe('')
  })

  it("ignore les événements EUR historiques au lieu de demander Stripe Connect", () => {
    const label = computePayoutGapLabel(
      [{ currency: 'EUR', region: 'France', cancelled: false }],
      { legacyCardPayoutReady: false, momos: {} }
    )
    expect(label).toBe('')
  })

  it('signale un numéro Mobile Money manquant par pays, sans doublon', () => {
    const label = computePayoutGapLabel(
      [
        { currency: 'XOF', region: 'Bénin', cancelled: false },
        { currency: 'XOF', region: 'Bénin', cancelled: false },
      ],
      { legacyCardPayoutReady: true, momos: {} }
    )
    expect(label).toBe('un numéro Mobile Money pour Bénin')
  })

  it('ne signale pas un pays dont le numéro est déjà configuré', () => {
    const label = computePayoutGapLabel(
      [{ currency: 'XOF', region: 'Bénin', cancelled: false }],
      { legacyCardPayoutReady: true, momos: { bj: '+2290197000000' } }
    )
    expect(label).toBe('')
  })

  it('signale seulement les manques Mobile Money Bénin, sans compte EUR ni région historique', () => {
    const label = computePayoutGapLabel(
      [
        { currency: 'EUR', region: 'France', cancelled: false },
        { currency: 'XOF', region: 'Togo', cancelled: false },
        { currency: 'XOF', region: 'Bénin', cancelled: false },
      ],
      { legacyCardPayoutReady: false, momos: {} }
    )
    expect(label).toBe('un numéro Mobile Money pour Bénin')
  })
})
