import { describe, expect, it } from 'vitest'
import { beninDayKey } from '../beninTime'
import { eventStartMs, eventEndMs } from '../event-time'

describe('jour et horaires du Benin', () => {
  it.each([
    ['2026-09-06T22:59:59Z', '2026-09-06'],
    ['2026-09-06T23:00:00Z', '2026-09-07'],
    ['2026-09-07T01:00:00+02:00', '2026-09-07'],
    ['2026-12-31T23:15:00Z', '2027-01-01'],
    ['2026-09-06', '2026-09-06'],
  ])('%s correspond au jour local %s', (input, day) => {
    expect(beninDayKey(input)).toBe(day)
    expect(beninDayKey(new Date(input))).toBe(day)
  })
  it.each([null, undefined, '', 'invalide', '2026-09-06T23:30:00'])('ne fabrique pas de jour pour %s', input => {
    expect(beninDayKey(input)).toBeNull()
  })
  it('utilise UTC+1 meme sans region renseignee', () => {
    expect(eventStartMs({ date: '2026-09-07', time: '00:00' })).toBe(Date.parse('2026-09-06T23:00:00Z'))
    expect(eventStartMs({ date: '2026-09-07', time: '00:00', region: 'Bénin' })).toBe(Date.parse('2026-09-06T23:00:00Z'))
  })
  it('calcule une soiree traversant minuit au Benin', () => {
    expect(eventEndMs({ date: '2026-09-06', time: '22:00', endTime: '04:00' })).toBe(Date.parse('2026-09-07T03:00:00Z'))
  })
})
