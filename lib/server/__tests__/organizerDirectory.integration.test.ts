import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import OrganizerProfile from '@/lib/models/OrganizerProfile'
import { getOrganizerEvents, listPublicOrganizersDirectory } from '../organizer/organizers'
import { directoryEventPipeline } from '../organizer/directoryEventPipeline'
import { isEventEnded } from '@/lib/shared/event-time'

const NOW = new Date('2026-09-07T00:30:00+01:00')
beforeAll(async () => { await getDb() })
beforeEach(async () => {
  await Event.deleteMany({})
  await OrganizerProfile.deleteMany({})
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function event(organizerId: string, overrides: Record<string, unknown> = {}) {
  return Event.create({ name: 'Concert Cotonou', date: '2026-09-07', time: '22:00', endTime: '04:00', organizerId, createdBy: organizerId, city: 'Cotonou', region: 'Bénin', currency: 'XOF', ...overrides })
}
async function profiles() {
  await OrganizerProfile.create(Array.from({ length: 14 }, (_, index) => ({ userId: `org-${index}`, publicName: `Organisateur ${index}`, slug: `organisateur-${index}`, status: 'public' as const, country: 'Bénin', regionId: 'benin', followersCount: 100 - index })))
}

describe('annuaire organise avant pagination, heure Benin', () => {
  it('remplit la premiere page filtree meme si les premiers profils n ont aucun evenement', async () => {
    await profiles()
    await event('org-12')
    await event('org-13')
    const result = await listPublicOrganizersDirectory({ upcoming: true, pageSize: 12 })
    expect(result.total).toBe(2)
    expect(result.organizers.map(item => item.userId)).toEqual(['org-12', 'org-13'])
    expect(result.totalPages).toBe(1)
    expect((await listPublicOrganizersDirectory({ upcoming: true, pageSize: 12, page: 2 })).organizers).toEqual([])
    expect((await listPublicOrganizersDirectory({ upcoming: 'false', pageSize: 12 })).organizers).toHaveLength(12)
  })

  it('choisit un evenement valide apres ceux termines ou placeholders, conserve la soiree apres minuit', async () => {
    await profiles()
    await event('org-13', { date: '2026-09-06', time: '19:00', endTime: '20:00' })
    await event('org-13', { name: 'Filler ancien', date: '2026-09-06', time: '20:00', endTime: '04:00' })
    const ongoing = await event('org-13', { date: '2026-09-06', time: '22:00', endTime: '04:00' })
    await event('org-12', { publishAt: new Date('2026-09-08T00:00:00Z') })
    await event('org-11', { isDemo: true })
    await event('org-10', { currency: 'EUR' })
    await event('org-9', { demoLabel: 'Demonstration' })
    const privateEvent = await event('org-8')
    await Event.collection.updateOne({ _id: privateEvent._id }, { $set: { isPrivate: true } })
    const result = await listPublicOrganizersDirectory({ upcoming: true })
    expect(result.total).toBe(1)
    expect(result.organizers[0].nextEvent?.id).toBe(ongoing.id)
    vi.setSystemTime(new Date('2026-09-07T04:00:00+01:00'))
    expect((await listPublicOrganizersDirectory({ upcoming: true })).total).toBe(0)
  })

  it('exclut aussi les demonstrations de la page publique organisateur', async () => {
    await event('org-1', { isDemo: true })
    await event('org-1', { demoLabel: 'Demo historique', date: '2026-08-01' })
    const visible = await event('org-1')
    const result = await getOrganizerEvents('org-1')
    expect(result.upcoming.map(item => item.id)).toEqual([visible.id])
    expect(result.past).toEqual([])
  })

  it.each([
    { date: '2026-09-06', time: '22:00', endTime: '04:00' },
    { date: '2026-09-06', time: '18:00', endTime: '23:00' },
    { date: '2026-09-07', time: '', endTime: '' },
    { date: '2026-09-06', time: '22:00', endTime: '22:00' },
    { date: '2026-09-06', time: '22:00', closingDate: new Date('2026-09-06T23:30:00Z') },
  ])('aligne la selection Mongo et la fin metier : %j', async fields => {
    const saved = await event('org-1', fields)
    const rows = await Event.aggregate([{ $match: { _id: saved._id } }, ...directoryEventPipeline(NOW)])
    expect(rows.length > 0).toBe(!isEventEnded(saved.toObject(), NOW.getTime()))
  })
})
