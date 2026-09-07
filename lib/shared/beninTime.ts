export const BENIN_TIME_ZONE = 'Africa/Porto-Novo'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BENIN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function beninDayKey(value: string | Date | null | undefined): string | null {
  if (!value) return null
  // An offset-less timestamp depends on the host timezone, so do not guess it.
  if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(value) && !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  const parts = dayFormatter.formatToParts(date)
  const part = (type: string) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
