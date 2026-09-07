import { describe, expect, it } from 'vitest'
import { cashRefundCollectedEmail } from '../emails/templates/refunds'

describe('notification de retrait cash', () => {
  it('confirme une remise au porteur et non un virement encore attendu', () => {
    const email = cashRefundCollectedEmail('Cotonou', '10 500 FCFA')
    expect(email.subject).toContain('Retrait en espèces enregistré')
    expect(email.html).toContain('au porteur du code')
    expect(email.html).toContain('Aucun virement supplémentaire')
    expect(email.html).not.toMatch(/apparaîtra|moyen de paiement|sous .*jours|meilleurs délais/)
    expect(email.inApp?.link).toContain('/profile/billets')
  })

  it('echappe les donnees affichees et ne contient aucun code de retrait', () => {
    const email = cashRefundCollectedEmail('<script>test</script>', '<100> FCFA')
    expect(email.html).not.toContain('<script>test</script>')
    expect(email.html).toContain('&lt;100&gt;')
  })
})
