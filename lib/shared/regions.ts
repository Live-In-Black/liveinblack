// Périmètre du lancement: Bénin uniquement. `currency` est la SOURCE UNIQUE
// du rail de paiement et le catalogue public ne doit exposer aucune autre
// région tant que le lancement reste limité au Bénin.
export type Region = {
  id: string
  name: string
  country: string
  flag: string
  code: string
  dial: string
  momoCountry: string | null
  currency: 'EUR' | 'XOF'
  lat: number
  lon: number
  // Identifiant IANA utilisé pour calculer les horaires réels des événements.
  timezone: string
}

export const regions: Region[] = [
  { id: 'benin', name: 'Bénin', country: 'Bénin', flag: '🇧🇯', code: 'BJ', dial: '+229', momoCountry: 'bj', currency: 'XOF', lat: 6.4, lon: 2.4, timezone: 'Africa/Porto-Novo' },
]

export const XOF_REGION_IDS: string[] = regions.filter((r) => r.currency === 'XOF').map((r) => r.id)

export function getRegionByName(name: string): Region {
  return regions.find((r) => r.name === name) || regions[0]
}
