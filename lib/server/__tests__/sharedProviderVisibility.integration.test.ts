import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import ProviderProfile from '@/lib/models/ProviderProfile'
import Conversation from '@/lib/models/Conversation'
import { resolveSendMessageContent } from '../messaging/messagingSendContentService'

beforeAll(async () => { await getDb() })
beforeEach(async () => { await ProviderProfile.deleteMany({}); await Conversation.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed(overrides: Record<string, unknown> = {}, itemOverrides: Record<string, unknown> = {}) {
  const profile = await ProviderProfile.create({
    userId: 'provider', name: 'Photo Cotonou', city: 'Cotonou', country: 'Bénin', regionId: 'benin',
    subscriptionActive: true, catalogCurrency: 'XOF', ...overrides,
  })
  await ProviderProfile.collection.updateOne({ _id: profile._id }, { $set: {
    catalog: [{ id: 'offer', name: 'Reportage', price: 90000, available: true, ...itemOverrides }],
  } })
  const conversation = await Conversation.create({ type: 'direct', participantIds: ['client', 'provider'] })
  const share = () => resolveSendMessageContent('client', conversation,
    { type: 'catalog_item', catalogItemId: 'offer', content: '{"price":1,"currency":"EUR"}' },
    { uploadDataUri: vi.fn(), imageMimeTypes: [], audioMimeTypes: [] })
  return { profile, share }
}

describe('offres partagees depuis le catalogue public uniquement', () => {
  it.each([
    { name: 'profil hors Benin', profile: { regionId: 'france', country: 'France' }, item: {} },
    { name: 'abonnement inactif', profile: { subscriptionActive: false }, item: {} },
    { name: 'offre indisponible', profile: {}, item: { available: false } },
    { name: 'offre explicitement EUR', profile: {}, item: { currency: 'EUR' } },
    { name: 'offre implicitement EUR', profile: { catalogCurrency: 'EUR' }, item: {} },
  ])('refuse $name', async ({ profile, item }) => {
    const { share } = await seed(profile, item)
    expect(await share()).toEqual({ ok: false, status: 404, error: 'catalog_item_not_found' })
  })

  it('refuse une devise historique inconnue sans supposer XOF', async () => {
    const { profile, share } = await seed()
    await ProviderProfile.collection.updateOne({ _id: profile._id }, { $unset: { catalogCurrency: '' } })
    expect(await share()).toMatchObject({ ok: false, status: 404 })
  })

  it.each(['XOF', 'EUR'])('conserve une offre explicitement XOF dans un catalogue %s sans reecrire les donnees', async currency => {
    const { profile, share } = await seed({ catalogCurrency: currency }, { currency: 'XOF' })
    const before = await ProviderProfile.collection.findOne({ _id: profile._id })
    const result = await share()
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('share_failed')
    expect(JSON.parse(result.content)).toMatchObject({ providerId: 'provider', itemId: 'offer', price: 90000, currency: 'XOF' })
    expect(await ProviderProfile.collection.findOne({ _id: profile._id })).toEqual(before)
  })

  it('conserve la devise XOF heritee du catalogue pour une offre ancienne', async () => {
    const { share } = await seed()
    const result = await share()
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('share_failed')
    expect(JSON.parse(result.content)).toMatchObject({ price: 90000, currency: 'XOF' })
  })
})
