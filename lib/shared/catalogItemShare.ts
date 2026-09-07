import { readMessageEventSnapshot } from './messageEventSnapshot'

export interface CatalogItemShare {
  providerId: string
  providerName: string
  itemId: string
  name: string
  description: string
  price: number | null
  currency: string | null
  priceLabel: string | null
  unit: string
  category: string
  image: string | null
}

export function parseCatalogItemShare(content: string | null): CatalogItemShare | null {
  let value: unknown
  try { value = content ? JSON.parse(content) : null } catch { return null }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const text = (key: string) => typeof raw[key] === 'string' ? raw[key] as string : ''
  const image = text('image')
  return {
    providerId: text('providerId').trim(), providerName: text('providerName'), itemId: text('itemId'),
    name: text('name'), description: text('description'), unit: text('unit'), category: text('category'),
    price: typeof raw.price === 'number' && Number.isFinite(raw.price) && raw.price >= 0 ? raw.price : null,
    currency: text('currency') || null,
    priceLabel: readMessageEventSnapshot(content)?.priceLabel?.replace(/^dès /, '') ?? null,
    image: /^https?:\/\//i.test(image) ? image : null,
  }
}
