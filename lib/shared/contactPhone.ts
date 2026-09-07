import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { isValidPhone } from './applicationValidation'
import { splitContactPhone } from './phoneCallingCodes'

export function normalizeContactPhoneParts(dialCode: string, number: string): string | null {
  const code = dialCode.trim()
  const national = number.trim()
  if (!/^\+\d{1,3}$/.test(code) || !/^[\d\s().-]+$/.test(national)) return null
  if (!isValidPhone(code, national)) return null
  const digits = national.replace(/\D/g, '')
  // Preserve the currently accepted Benin formats; do not migrate old numbers implicitly.
  if (code === '+229') return `${code}${digits}`
  return parsePhoneNumberFromString(`${code}${digits}`)?.number ?? null
}

export function normalizeStoredContactPhone(phone: string): string | null {
  const value = phone.trim()
  const parts = splitContactPhone(value)
  if (!value.startsWith(parts.dialCode)) return null
  return normalizeContactPhoneParts(parts.dialCode, parts.number)
}
