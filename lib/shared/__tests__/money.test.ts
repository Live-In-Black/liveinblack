// Port du sous-ensemble "money" de scripts/fedapay.test.mjs
import { describe, it, expect } from 'vitest'
import { fmtMoney, eventCurrency, regionToCurrency } from '../money'

describe('regionToCurrency', () => {
  it('Togo/Bénin et défaut → XOF, France explicite reste EUR legacy', () => {
    expect(regionToCurrency('Togo')).toBe('XOF')
    expect(regionToCurrency('Bénin')).toBe('XOF')
    expect(regionToCurrency('benin')).toBe('XOF')
    expect(regionToCurrency('France')).toBe('EUR')
    expect(regionToCurrency('')).toBe('XOF')
    expect(regionToCurrency(null)).toBe('XOF')
  })
})

describe('eventCurrency', () => {
  it('utilise XOF par défaut sans convertir un EUR explicite', () => {
    expect(eventCurrency({ currency: 'XOF' })).toBe('XOF')
    expect(eventCurrency({ currency: 'xof' })).toBe('XOF')
    expect(eventCurrency({ currency: 'EUR' })).toBe('EUR')
    expect(eventCurrency({})).toBe('XOF')
    expect(eventCurrency(null)).toBe('XOF')
  })
})

// `toLocaleString('fr-FR')` insère un séparateur de milliers dont le
// caractère exact dépend de la version ICU du runtime (espace normale,
// insécable, ou fine insécable) — on normalise tout espace Unicode avant
// comparaison plutôt que de dépendre d'un caractère précis.
function normalizeSpaces(s: string): string {
  return s.replace(/\s/gu, ' ')
}

describe('fmtMoney', () => {
  it('XOF entier avec suffixe FCFA, EUR avec décimales seulement si utiles', () => {
    expect(normalizeSpaces(fmtMoney(5000, 'XOF'))).toBe('5 000 FCFA')
    expect(normalizeSpaces(fmtMoney(12, 'EUR'))).toBe('12 €')
    expect(normalizeSpaces(fmtMoney(12.5, 'EUR'))).toBe('12,50 €')
  })
})
