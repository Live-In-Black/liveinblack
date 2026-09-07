import { getCountries, getCountryCallingCode } from 'libphonenumber-js'

export const DEFAULT_PHONE_CALLING_CODE = '+229'

// Contact numbers are independent of the marketplace's launch geography.
const countriesByDial = new Map<string, string[]>()
for (const country of getCountries()) {
  const dial = `+${getCountryCallingCode(country)}`
  countriesByDial.set(dial, [...(countriesByDial.get(dial) ?? []), country])
}

const names = new Intl.DisplayNames(['fr'], { type: 'region' })
export const phoneCallingCodeOptions = [...countriesByDial].map(([value, countries]) => ({
  value,
  label: `${value} · ${countries.length === 1 ? names.of(countries[0]) : 'Plusieurs pays'}`,
})).sort((a, b) => {
  if (a.value === DEFAULT_PHONE_CALLING_CODE) return -1
  if (b.value === DEFAULT_PHONE_CALLING_CODE) return 1
  return Number(a.value) - Number(b.value)
})

export function splitContactPhone(phone: string): { dialCode: string; number: string } {
  const value = phone.trim()
  const match = [...phoneCallingCodeOptions]
    .sort((a, b) => b.value.length - a.value.length)
    .find((option) => value.startsWith(option.value))
  return match
    ? { dialCode: match.value, number: value.slice(match.value.length).trim() }
    : { dialCode: DEFAULT_PHONE_CALLING_CODE, number: value }
}
