import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('V1 FedaPay checkout', () => {
  it.each([
    'app/api/checkout/fedapay/route.ts',
    'app/api/seat-holds/fedapay/route.ts',
    'app/api/checkout/seat-hold/fedapay/route.ts',
    'lib/server/agent/agentSales.ts',
  ])('ne bloque pas le paiement des evenements existants sans sous-compte Marketplace: %s', (relativePath) => {
    const source = readFileSync(relativePath, 'utf8')

    expect(source).not.toContain('fedapay_marketplace_account_required')
    expect(source).toContain('fedapayMarketplaceCommissions')
  })

  it('bloque encore la publication organisateur tant que Marketplace nest pas configure', () => {
    const source = readFileSync('app/api/organizer-events/route.ts', 'utf8')

    expect(source).toContain('fedapay_marketplace_account_required')
    expect(source).toContain('listPayoutMomos')
  })
})

describe('V1 sans points de fidelite', () => {
  it.each([
    'app/(public)/about/TabsSection.tsx',
    'app/(app)/profile/ProfilClient.tsx',
    'app/(app)/profile/ProfileOverview.module.css',
    'app/components/features/events/EventCheckoutPanel.tsx',
    'app/(app)/scanner/[eventId]/ScannerClient.tsx',
  ])('ne promet pas de points dans les surfaces utilisateur: %s', (relativePath) => {
    const source = readFileSync(relativePath, 'utf8')

    expect(source).not.toMatch(/Points fidélité|point de fidélité|cumule des points|points à chaque sortie|pointsValue/)
  })

  it('ne crédite pas de points au check-in', () => {
    const source = readFileSync('lib/server/events/ticketCheckin.ts', 'utf8')

    expect(source).toContain('const pointAwarded = false')
    expect(source).not.toContain('holder.points')
    expect(source).not.toContain('(holder.points || 0) + 1')
  })

  it('ne renvoie plus de compteur de points dans le profil V1', () => {
    expect(readFileSync('lib/server/users/profile.ts', 'utf8')).not.toMatch(/\bpoints:\s*user\.points/)
    expect(readFileSync('app/(app)/profile/ProfilClient.tsx', 'utf8')).not.toMatch(/\bpoints:\s*number/)
  })
})

describe('V1 agents terrain separes des admins', () => {
  it('ne donne pas au role global agent un passe-droit scanner', () => {
    const source = readFileSync('lib/server/events/ticketCheckin.ts', 'utf8')

    expect(source).not.toContain("let allowed = caller.roles.includes('agent')")
    expect(source).toContain('OrganizerMember.findOne')
    expect(source).toContain("permissions: 'scan'")
  })
})

describe('V1 comptes separes par email', () => {
  it('refuse de creer un client avec un email deja utilise', () => {
    const source = readFileSync('app/api/auth/register/route.ts', 'utf8')

    expect(source).toContain('User.findOne({ email })')
    expect(source).toContain("error: 'email_taken'")
  })

  it('impose un compte organisateur/prestataire dedie pour les candidatures', () => {
    const source = readFileSync('lib/server/provider/applications.ts', 'utf8')

    expect(source).toContain('function hasDedicatedAccount')
    expect(source).toContain("user.roles.filter((role) => role !== 'agent')")
    expect(source).toContain('businessRoles.length === 1')
    expect(source).toContain("error: 'separate_account_required'")
    expect(source).toContain("roles: ['organisateur']")
    expect(source).toContain("roles: ['prestataire']")
    expect(source.match(/User\.findOne\(\{ email \}\)\.lean\(\)/g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe('V1 accueil sans liens evenement orphelins', () => {
  it('construit le Top 3 web depuis les evenements publics disponibles', () => {
    const source = readFileSync('app/(public)/home/page.tsx', 'utf8')

    expect(source).toContain('const allEvents = allEventsResult.events')
    expect(source).toContain('const topThree = [...allEvents]')
    expect(source).toContain('topThree.map((event')
  })

  it('filtre les evenements actualite supprimes avant affichage public', () => {
    const source = readFileSync('app/(public)/home/page.tsx', 'utf8')

    expect(source).toContain('const byId = new Map(allEvents.map((e) => [e.id, e]))')
    expect(source).toContain('actualiteConfig.eventIds.map((id) => byId.get(id)).filter')
  })
})
