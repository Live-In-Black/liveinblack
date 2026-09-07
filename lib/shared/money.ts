// Formatage monétaire V1 Bénin : XOF/FCFA par défaut. Les valeurs explicitement
// EUR restent affichées en EUR afin de ne pas convertir silencieusement un
// historique financier qui doit être migré à part.
import { regions } from './regions'
import { stripDiacritics } from './diacritics'

function normKey(s: unknown): string {
  return stripDiacritics(String(s || ''))
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
    .trim()
    .toLowerCase()
}

const XOF_REGION_KEYS = new Set(
  regions
    .filter((r) => r.currency === 'XOF')
    .flatMap((r) => [r.id, r.code, r.name, r.country])
    .map(normKey)
)

const LEGACY_XOF_REGION_KEYS = new Set([
  'togo', 'tg', 'cote-d-ivoire', 'ci', 'senegal', 'sn', 'burkina-faso', 'bf',
  'mali', 'ml', 'niger', 'ne', 'guinee-bissau', 'gw',
])

const LEGACY_EUR_REGION_KEYS = new Set(['france', 'fr'])

export function regionToCurrency(region: unknown): 'EUR' | 'XOF' {
  const key = normKey(region)
  if (LEGACY_EUR_REGION_KEYS.has(key)) return 'EUR'
  if (XOF_REGION_KEYS.has(key) || LEGACY_XOF_REGION_KEYS.has(key)) return 'XOF'
  return 'XOF'
}

export function eventCurrency(event: { currency?: string } | null | undefined): 'EUR' | 'XOF' {
  if (!event) return 'XOF'
  const currency = String(event.currency || '').toUpperCase()
  if (currency === 'EUR') return 'EUR'
  return 'XOF'
}

export function organizerCurrency(profile: { regionId?: string; country?: string } | null | undefined): 'EUR' | 'XOF' | null {
  if (!profile) return null
  const anchor = profile.regionId || profile.country
  if (!anchor) return null
  return regionToCurrency(anchor)
}

export function payRailLabel(currency: string = 'XOF'): string {
  return String(currency).toUpperCase() === 'EUR' ? 'Rail historique indisponible en V1' : 'Mobile Money / carte (FedaPay)'
}

export function fmtMoney(amount: unknown, currency: string = 'XOF'): string {
  const n = Number(amount) || 0
  if (String(currency).toUpperCase() === 'XOF') {
    return `${Math.round(n).toLocaleString('fr-FR')} FCFA`
  }
  const hasCents = Math.round(n * 100) % 100 !== 0
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })} €`
}

export function currencySymbol(currency: string = 'XOF'): string {
  return String(currency).toUpperCase() === 'XOF' ? 'FCFA' : '€'
}
