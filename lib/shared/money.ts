// Port TypeScript de src/utils/money.js — formatage monétaire multi-devise
// (EUR/Stripe, XOF/FedaPay). Règle : XOF sans décimales, EUR avec décimales
// seulement si nécessaires. La devise d'un événement est EXPLICITE (event.currency),
// jamais déduite de sa région (voir commentaire d'origine : des events Togo/Bénin
// créés avant le multi-devise ont des prix saisis en euros).
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

const LEGACY_EUR_REGION_KEYS = new Set(['france', 'fr'])

export function regionToCurrency(region: unknown): 'EUR' | 'XOF' {
  const key = normKey(region)
  if (LEGACY_EUR_REGION_KEYS.has(key)) return 'EUR'
  return XOF_REGION_KEYS.has(key) ? 'XOF' : 'XOF'
}

export function eventCurrency(event: { currency?: string } | null | undefined): 'EUR' | 'XOF' {
  if (!event) return 'XOF'
  return String(event.currency || '').toUpperCase() === 'EUR' ? 'EUR' : 'XOF'
}

export function organizerCurrency(profile: { regionId?: string; country?: string } | null | undefined): 'EUR' | 'XOF' | null {
  if (!profile) return null
  const anchor = profile.regionId || profile.country
  if (!anchor) return null
  return regionToCurrency(anchor)
}

export function payRailLabel(currency: string = 'XOF'): string {
  return String(currency).toUpperCase() === 'EUR' ? 'Carte bancaire (Stripe)' : 'Mobile Money / carte (FedaPay)'
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
