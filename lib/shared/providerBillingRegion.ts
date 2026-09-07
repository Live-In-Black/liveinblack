// Port TypeScript de lib/providerBillingRegion.js. Les anciennes regions
// restent normalisables pour lire l'historique, mais la facturation active V1
// est forcee au Benin dans lib/server/provider/providerBillingUtils.ts.
import { regions } from './regions'
import { stripDiacritics } from './diacritics'

function normKey(value: unknown): string {
  const token = typeof value === 'object' && value !== null ? ((value as { id?: string; name?: string }).id ?? (value as { name?: string }).name ?? '') : value
  return stripDiacritics(String(token ?? ''))
    .trim()
    .replace(/[\s’']+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const BY_KEY = new Map<string, string>()
for (const r of regions) {
  for (const key of [r.id, r.code, r.name, r.country]) {
    BY_KEY.set(normKey(key), r.id)
  }
}

// Alias courts (indicatifs pays ISO-2) non déjà couverts par `regions[].code`.
const EXTRA_ALIASES: Record<string, string> = {
  france: 'france', fr: 'france', togo: 'togo', tg: 'togo', bj: 'benin',
  'cote-d-ivoire': 'cote-ivoire', 'cote-ivoire': 'cote-ivoire', ci: 'cote-ivoire',
  senegal: 'senegal', sn: 'senegal', 'burkina-faso': 'burkina-faso', bf: 'burkina-faso',
  mali: 'mali', ml: 'mali', niger: 'niger', ne: 'niger',
  'guinee-bissau': 'guinee-bissau', gw: 'guinee-bissau',
}

// Ces régions ne sont plus proposées pour les nouveaux profils, mais leurs
// identifiants doivent rester lisibles pour les anciens comptes et factures.
const LEGACY_BILLING_CURRENCIES: Record<string, 'EUR' | 'XOF'> = {
  france: 'EUR',
  togo: 'XOF',
  'cote-ivoire': 'XOF',
  senegal: 'XOF',
  'burkina-faso': 'XOF',
  mali: 'XOF',
  niger: 'XOF',
  'guinee-bissau': 'XOF',
}

export function normalizeProviderBillingRegion(value: unknown): string {
  const key = normKey(value)
  return BY_KEY.get(key) || EXTRA_ALIASES[key] || ''
}

export function providerBillingCurrency(regionId: unknown): 'EUR' | 'XOF' {
  const id = normalizeProviderBillingRegion(regionId)
  const region = regions.find((r) => r.id === id)
  if (region) return region.currency === 'XOF' ? 'XOF' : 'EUR'
  return LEGACY_BILLING_CURRENCIES[id] || 'EUR'
}
