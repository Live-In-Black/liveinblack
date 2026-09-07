// Barème V1 Bénin du système de boost Top 1/2/3, montants en FCFA.
import { stripDiacritics } from './diacritics'
export type BoostTier = { label: string; price: number; days: number }
export type BoostPlan = { position: number; label: string; description: string; color: string; tiers: BoostTier[] }

export const BOOST_PLANS: readonly BoostPlan[] = Object.freeze([
  { position: 1, label: 'Top 1', description: 'Position n°1 · Visibilité maximale', color: '#f53d8d', tiers: [
    { label: '1 jour', price: 5000, days: 1 }, { label: '2 jours', price: 9000, days: 2 },
    { label: '3 jours', price: 13000, days: 3 }, { label: '4 jours', price: 17000, days: 4 },
    { label: '5 jours', price: 21500, days: 5 }, { label: '6 jours', price: 26000, days: 6 },
    { label: '7 jours', price: 30000, days: 7 },
  ] },
  { position: 2, label: 'Top 2', description: 'Position n°2 · Très haute visibilité', color: 'rgba(255,255,255,0.65)', tiers: [
    { label: '1 jour', price: 3500, days: 1 }, { label: '2 jours', price: 6500, days: 2 },
    { label: '3 jours', price: 9500, days: 3 }, { label: '4 jours', price: 12500, days: 4 },
    { label: '5 jours', price: 15000, days: 5 }, { label: '6 jours', price: 17500, days: 6 },
    { label: '7 jours', price: 20000, days: 7 },
  ] },
  { position: 3, label: 'Top 3', description: 'Position n°3 · Haute visibilité', color: 'rgba(245,61,141,0.6)', tiers: [
    { label: '1 jour', price: 2500, days: 1 }, { label: '2 jours', price: 4500, days: 2 },
    { label: '3 jours', price: 6500, days: 3 }, { label: '4 jours', price: 8500, days: 4 },
    { label: '5 jours', price: 10000, days: 5 }, { label: '6 jours', price: 11500, days: 6 },
    { label: '7 jours', price: 12500, days: 7 },
  ] },
])

export function getBoostPlan(position: number, days: number): { plan: BoostPlan; tier: BoostTier } | null {
  const plan = BOOST_PLANS.find((item) => item.position === Number(position))
  const tier = plan?.tiers.find((item) => item.days === Number(days))
  return plan && tier ? { plan, tier } : null
}

export function normalizeBoostRegion(value: string = ''): string {
  const token = stripDiacritics(String(value || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (!token) return ''
  if (token === 'fr' || token === 'france' || token.includes('france')) return 'france'
  if (token === 'tg' || token === 'togo' || token.includes('togo')) return 'togo'
  if (token === 'bj' || token === 'benin' || token.includes('benin')) return 'benin'
  return token.replace(/\s+/g, '-')
}

export function boostSlotId(region: string, position: number): string {
  return `${normalizeBoostRegion(region) || 'unknown'}__top_${Number(position)}`
}

export type BoostLike = {
  id?: string
  eventId?: string
  position?: number
  region?: string
  regionId?: string
  purchasedAt?: string | Date
  expiresAt?: string | Date
  status?: string
  conflict?: boolean
}

export function isBoostActive(boost: BoostLike | null | undefined, now: number = Date.now()): boolean {
  const expiry = new Date(boost?.expiresAt || 0).getTime()
  return (
    Number.isFinite(expiry) &&
    expiry > now &&
    boost?.conflict !== true &&
    !['refunded_conflict', 'cancelled'].includes(boost?.status || '')
  )
}

export function activeBoostsForRegion(boosts: BoostLike[] = [], region: string = '', now: number = Date.now()): BoostLike[] {
  const wanted = normalizeBoostRegion(region)
  return boosts
    .filter((boost) => isBoostActive(boost, now))
    .filter((boost) => {
      const actual = normalizeBoostRegion(boost.regionId || boost.region || '')
      return !wanted || !actual || actual === wanted
    })
    .sort((a, b) => {
      const byPosition = Number(a.position) - Number(b.position)
      if (byPosition) return byPosition
      const byPurchase = new Date(a.purchasedAt || 0).getTime() - new Date(b.purchasedAt || 0).getTime()
      return byPurchase || String(a.id || '').localeCompare(String(b.id || ''))
    })
}

export function buildRegionalTopThree<T extends { id?: string }>({
  events = [],
  fallbackEvents = [],
  boosts = [],
  region = '',
  now = Date.now(),
  isEligible = () => true,
}: {
  events?: T[]
  fallbackEvents?: T[]
  boosts?: BoostLike[]
  region?: string
  now?: number
  isEligible?: (event: T) => boolean
}): Array<T & { boostPosition?: number; displayPosition: number; featured: boolean }> {
  const byId = new Map(events.map((event) => [String(event.id), event]))
  const slots: Array<(T & { boostPosition?: number; displayPosition: number; featured: boolean }) | null> = [null, null, null]
  const used = new Set<string>()

  for (const boost of activeBoostsForRegion(boosts, region, now)) {
    const position = Number(boost.position)
    if (position < 1 || position > 3 || slots[position - 1]) continue
    const event = byId.get(String(boost.eventId))
    if (!event || !isEligible(event) || used.has(String(event.id))) continue
    slots[position - 1] = { ...event, boostPosition: position, displayPosition: position, featured: true }
    used.add(String(event.id))
  }

  let fallbackIndex = 0
  for (let index = 0; index < slots.length; index += 1) {
    while (!slots[index] && fallbackIndex < fallbackEvents.length) {
      const event = fallbackEvents[fallbackIndex++]
      if (!event || used.has(String(event.id)) || !isEligible(event)) continue
      slots[index] = { ...event, displayPosition: index + 1, featured: false }
      used.add(String(event.id))
    }
  }
  return slots.filter((s): s is T & { boostPosition?: number; displayPosition: number; featured: boolean } => Boolean(s))
}
