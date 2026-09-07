import { stripDiacritics } from '@/lib/shared/diacritics'
import { splitContactPhone } from '@/lib/shared/phoneCallingCodes'

export interface SearchableSettingEntry {
  id: string
  keywords: string[]
}

export function normalizeSettingsQuery(value: string): string {
  return stripDiacritics(value).toLowerCase().trim()
}

export function settingsInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function filterSettingEntries<T extends SearchableSettingEntry>(entries: T[], query: string): T[] {
  const normalized = normalizeSettingsQuery(query)
  const tokens = normalized.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return entries
  return entries.filter((entry) =>
    tokens.every(
      (token) =>
        entry.keywords.some((keyword) => normalizeSettingsQuery(keyword).includes(token)) ||
        normalizeSettingsQuery(entry.id).includes(token)
    )
  )
}

export function splitPhone(phone: string): { dialCode: string; number: string } {
  return splitContactPhone(phone)
}
