export function readMessageEventSnapshot(content: string | null) {
  let value: unknown
  try { value = content ? JSON.parse(content) : null } catch { return null }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const text = (key: string) => typeof raw[key] === 'string' ? raw[key] as string : undefined
  const price = typeof raw.price === 'number' && Number.isFinite(raw.price) && raw.price >= 0 ? raw.price : null
  const currency = text('currency')
  let priceLabel: string | null = null
  if (raw.price != null) {
    if (price == null || !['XOF', 'EUR'].includes(currency || '')) priceLabel = 'Prix à vérifier'
    else if (currency === 'EUR') priceLabel = `${price} EUR (ancien tarif)`
    else if (!Number.isInteger(price)) priceLabel = 'Prix à vérifier'
    else priceLabel = `dès ${price} FCFA`
  }
  return { id: text('id'), name: text('name'), date: text('date'), image: text('image'), priceLabel }
}
