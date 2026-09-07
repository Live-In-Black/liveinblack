import { describe, expect, it } from 'vitest'
import { normalizeContactPhoneParts, normalizeStoredContactPhone } from '../contactPhone'

describe('canonical contact numbers', () => {
  it.each([
    ['+229', '01 96 12 34 56', '+2290196123456'],
    ['+229', '96 12 34 56', '+22996123456'],
    ['+33', '06 12 34 56 78', '+33612345678'],
    ['+39', '02 1234 5678', '+390212345678'],
    ['+1', '(415) 555-2671', '+14155552671'],
  ])('preserves meaningful digits for %s', (dial, number, expected) => {
    expect(normalizeContactPhoneParts(dial, number)).toBe(expected)
    expect(normalizeStoredContactPhone(`${dial} ${number}`)).toBe(expected)
  })
  it.each(['123', 'phone0612345678', '+33612345678', ''])('rejects invalid national input %s', (number) => {
    expect(normalizeContactPhoneParts('+33', number)).toBeNull()
  })
})
