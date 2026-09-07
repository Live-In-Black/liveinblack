import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import { getEventById } from '../events/events'
import { resolveSendMessageContent } from '../messaging/messagingSendContentService'
import { createEventPoll } from '../messaging/polls'
import { seedCatalogEvent } from './integrationTestHelpers'

beforeAll(async () => { await getDb() })
beforeEach(async () => {
  await Event.deleteMany({})
  await Conversation.deleteMany({})
  await Message.deleteMany({})
})
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function context() {
  const caller = { id: new mongoose.Types.ObjectId().toString() }
  const conversation = await Conversation.create({ type: 'group', participantIds: [caller.id] })
  const share = (eventId: string) => resolveSendMessageContent(caller.id, conversation,
    { type: 'event', eventId, content: 'Valeur client ignoree' },
    { uploadDataUri: vi.fn(), imageMimeTypes: [], audioMimeTypes: [] })
  const poll = (eventId: string) => createEventPoll(caller, { conversationId: conversation.id, eventId })
  return { conversation, share, poll }
}

describe('meme visibilite pour fiche publique, partage et sondage evenement', () => {
  it.each([
    { name: 'EUR', override: { currency: 'EUR' } },
    { name: 'hors Benin', override: { region: 'France', city: 'Paris' } },
    { name: 'prive', override: { isPrivate: true } },
    { name: 'publication future', override: { publishAt: new Date('2098-01-01') } },
    { name: 'annule', override: { cancelled: true } },
    { name: 'demo', override: { isDemo: true } },
    { name: 'label demo', override: { demoLabel: 'Exemple' } },
    { name: 'remplissage', override: { name: 'Filler evenement' } },
    { name: 'termine', override: { date: '2000-01-01' } },
  ])('refuse $name sans creer de message ni de reveil', async ({ override }) => {
    const event = await seedCatalogEvent({ currency: 'XOF', region: 'Bénin', city: 'Cotonou', ...override })
    const ctx = await context()
    expect(await getEventById(event.id)).toEqual({ status: 'not_found' })
    expect(await ctx.share(event.id)).toEqual({ ok: false, status: 404, error: 'event_not_found' })
    expect(await ctx.poll(event.id)).toEqual({ ok: false, status: 404, error: 'event_not_found' })
    expect(await Message.countDocuments({})).toBe(0)
    expect((await Conversation.findById(ctx.conversation.id))?.messageDigestNextCheckAt).toBeNull()
  })

  it('ne suppose pas XOF pour un ancien document sans devise', async () => {
    const event = await seedCatalogEvent({ currency: 'XOF', region: 'Bénin' })
    await Event.collection.updateOne({ _id: event._id }, { $unset: { currency: '' } })
    const ctx = await context()
    expect(await ctx.share(event.id)).toMatchObject({ ok: false, status: 404 })
    expect(await ctx.poll(event.id)).toMatchObject({ ok: false, status: 404 })
  })

  it('renvoie une erreur normale pour un identifiant malforme', async () => {
    const ctx = await context()
    expect(await ctx.share('invalide')).toMatchObject({ ok: false, status: 404 })
    expect(await ctx.poll('invalide')).toMatchObject({ ok: false, status: 404 })
  })

  it('conserve le prix XOF reel dans le partage et le sondage autorises', async () => {
    const event = await seedCatalogEvent({ currency: 'XOF', region: 'Bénin', city: 'Cotonou' })
    const ctx = await context()
    const shared = await ctx.share(event.id)
    expect(shared.ok).toBe(true)
    if (!shared.ok) throw new Error('share_failed')
    expect(JSON.parse(shared.content)).toMatchObject({ id: event.id, price: 1000, currency: 'XOF' })
    const poll = await ctx.poll(event.id)
    expect(poll.ok).toBe(true)
    if (!poll.ok) throw new Error('poll_failed')
    expect(poll.message.poll?.event).toMatchObject({ id: event.id, price: 1000, currency: 'XOF' })
  })
})
