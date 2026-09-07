import { regions } from './regions'
import { normalizeRegionId } from './locations'

// Port du calcul "payoutGaps"/"payoutGapLabel" de MesEvenementsPage.jsx (#7
// phase organisateur) — bannière du tableau de bord signalant qu'un
// organisateur a des événements ACTIFS (non annulés) dont la recette
// resterait en attente faute d'un moyen d'encaissement configuré. V1 Bénin :
// seules les recettes XOF/FedaPay sont actionnables ici, jamais Stripe Connect.

export interface PayoutGapEvent {
  currency: 'EUR' | 'XOF'
  region: string
  cancelled: boolean
}

export interface PayoutGapInputs {
  stripeChargesEnabled: boolean
  momos: Record<string, string>
}

const LEGACY_MOMO_BY_REGION: Record<string, { country: string; name: string }> = {
  togo: { country: 'tg', name: 'Togo' },
  'cote-ivoire': { country: 'ci', name: "Côte d'Ivoire" },
  senegal: { country: 'sn', name: 'Sénégal' },
  'burkina-faso': { country: 'bf', name: 'Burkina Faso' },
  mali: { country: 'ml', name: 'Mali' },
  niger: { country: 'ne', name: 'Niger' },
  'guinee-bissau': { country: 'gw', name: 'Guinée-Bissau' },
}

export function computePayoutGapLabel(events: PayoutGapEvent[], inputs: PayoutGapInputs): string {
  const active = events.filter((e) => !e.cancelled)

  void inputs.stripeChargesEnabled

  const missingMomoCountries = new Set<string>()
  for (const e of active) {
    if (e.currency !== 'XOF') continue
    const regionId = normalizeRegionId(e.region)
    const region = regions.find((r) => r.id === regionId)
    const legacy = LEGACY_MOMO_BY_REGION[regionId]
    const momoCountry = region?.momoCountry || legacy?.country
    if (momoCountry && !inputs.momos[momoCountry]) missingMomoCountries.add(momoCountry)
  }

  const parts: string[] = []
  for (const country of missingMomoCountries) {
    const region = regions.find((r) => r.momoCountry === country)
    const legacy = Object.values(LEGACY_MOMO_BY_REGION).find((entry) => entry.country === country)
    parts.push(`un numéro Mobile Money pour ${region?.name || legacy?.name || country}`)
  }
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`
}
