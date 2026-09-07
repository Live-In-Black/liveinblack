// Port de scripts/event-discovery.test.mjs (sous-ensemble eventUrgency/event-time)
import { describe, it, expect } from 'vitest'
import { getEventEndTimestamp, isEventOngoingOrStartingWithin } from '../eventUrgency'
import { eventEffectiveEndMs, isEventEnded } from '../event-time'

describe('eventUrgency / event-time', () => {
  it('une soirée qui traverse minuit reste visible jusqu’à son heure de fin', () => {
    // Event wall-clock times are in Benin, independent of the test host.
    const event = { date: '2026-07-05', time: '21:00', endTime: '06:00' }
    const during = Date.parse('2026-07-06T04:31:00+01:00')
    const after = Date.parse('2026-07-06T06:01:00+01:00')

    expect(isEventOngoingOrStartingWithin(event, during)).toBe(true)
    expect(isEventOngoingOrStartingWithin(event, after)).toBe(false)
    expect(getEventEndTimestamp(event)).toBe(Date.parse('2026-07-06T06:00:00+01:00'))
  })

  it('un événement à venir entre dans la fenêtre de 18 heures, mais pas au-delà', () => {
    const now = Date.parse('2026-07-06T08:00:00+01:00')
    expect(isEventOngoingOrStartingWithin({ date: '2026-07-06', time: '22:00', endTime: '04:00' }, now)).toBe(true)
    expect(isEventOngoingOrStartingWithin({ date: '2026-07-07', time: '08:30', endTime: '11:00' }, now)).toBe(false)
  })

  it('un billet expire à la fin de la soirée, y compris après minuit', () => {
    const event = { date: '2026-07-05', time: '21:00', endTime: '06:00' }
    const justBefore = Date.parse('2026-07-06T05:59:59+01:00')
    const atClosing = Date.parse('2026-07-06T06:00:00+01:00')

    expect(isEventEnded(event, justBefore)).toBe(false)
    expect(isEventEnded(event, atClosing)).toBe(true)
  })

  it('closingDate prime sur l’horaire théorique de fin', () => {
    const event = { date: '2026-07-05', time: '21:00', endTime: '02:00', closingDate: '2026-07-06T04:30:00+01:00' }

    expect(eventEffectiveEndMs(event)).toBe(Date.parse('2026-07-06T04:30:00+01:00'))
    expect(isEventEnded(event, Date.parse('2026-07-06T03:00:00+01:00'))).toBe(false)
    expect(isEventEnded(event, Date.parse('2026-07-06T04:30:00+01:00'))).toBe(true)
  })
})
