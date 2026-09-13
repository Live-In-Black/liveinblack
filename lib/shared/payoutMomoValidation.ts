import { regions } from './regions'

// V1 Bénin — numéro Mobile Money indexé par `momoCountry` (bj). Format
// international obligatoire, préfixé par l'indicatif du pays choisi.

export const MOMO_REGIONS = regions.filter((r) => r.momoCountry)

const SUPPORTED_MOMO_COUNTRIES = new Set(
  MOMO_REGIONS
    .map((r) => r.momoCountry)
    .filter((country): country is string => Boolean(country))
)

export type MomoValidationResult = { ok: true; number: string } | { ok: false; error: string }

export function isSupportedMomoCountry(momoCountry: string | null | undefined): momoCountry is string {
  return typeof momoCountry === 'string' && SUPPORTED_MOMO_COUNTRIES.has(momoCountry)
}

export function validateMomoNumber(momoCountry: string, rawNumber: string): MomoValidationResult {
  const region = MOMO_REGIONS.find((r) => r.momoCountry === momoCountry)
  if (!region) return { ok: false, error: 'Pays Mobile Money inconnu.' }

  const raw = String(rawNumber || '').replace(/[\s.-]/g, '').trim()
  if (!raw) return { ok: false, error: `Numéro requis pour ${region.name}.` }
  if (!raw.startsWith(region.dial) || !/^\+\d{3}\d{7,10}$/.test(raw)) {
    return { ok: false, error: `Numéro invalide pour ${region.name}. Format international, ex. ${region.dial} 01 97 00 00 00.` }
  }
  return { ok: true, number: raw }
}
