import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import ProviderProfile from '@/lib/models/ProviderProfile'
import { getProviderByUserId, listPublicProviders, listPublicProvidersDirectory } from '../provider/providers'

beforeAll(async () => { await getDb() })
beforeEach(async () => { await ProviderProfile.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed(currency: 'EUR' | 'XOF') {
  const profile = await ProviderProfile.create({ userId: 'provider', name: 'Photographe Cotonou', subscriptionActive: true, city: 'Cotonou', country: 'Bénin', regionId: 'benin', catalogCurrency: currency })
  // Raw historical documents deliberately lack per-item currency defaults.
  await ProviderProfile.collection.updateOne({ _id: profile._id }, { $set: { catalog: [
    { id: 'legacy', name: 'Ancienne offre', price: 150, available: true },
    { id: 'euro', name: 'Offre EUR', price: 200, currency: 'EUR', available: true },
    { id: 'xof', name: 'Offre Benin', price: 90000, currency: 'XOF', available: true },
    { id: 'hidden', name: 'Offre masquee', price: 1000, currency: 'XOF', available: false },
  ] } })
  return profile
}

describe('catalogue public sans fausse conversion EUR/XOF', () => {
  it('filtre EUR et devise implicite EUR sur fiche, annuaire et liste SEO', async () => {
    const profile = await seed('EUR')
    const before = await ProviderProfile.collection.findOne({ _id: profile._id })
    const detail = await getProviderByUserId('provider')
    const directory = await listPublicProvidersDirectory()
    const seo = await listPublicProviders()
    for (const view of [detail, directory.providers[0], seo[0]]) {
      expect(view?.catalog.map(item => [item.id, item.price])).toEqual([['xof', 90000]])
      expect(view?.catalogCurrency).toBe('XOF')
    }
    expect(await ProviderProfile.collection.findOne({ _id: profile._id })).toEqual(before)
  })

  it('conserve un prix historique dont la devise de catalogue est bien XOF', async () => {
    await seed('XOF')
    const view = await getProviderByUserId('provider')
    expect(view?.catalog.map(item => [item.id, item.price])).toEqual([['legacy', 150], ['xof', 90000]])
  })

  it('la vue interne agent conserve les montants et devises a auditer', async () => {
    await seed('EUR')
    const view = await getProviderByUserId('provider', { id: 'agent', activeRole: 'agent' })
    expect(view?.catalogCurrency).toBe('EUR')
    expect(view?.catalog.map(item => item.id)).toEqual(['legacy', 'euro', 'xof', 'hidden'])
  })

  it('ne suppose pas une devise pour une ancienne offre non documentee', async () => {
    const profile = await seed('EUR')
    await ProviderProfile.collection.updateOne({ _id: profile._id }, { $unset: { catalogCurrency: '' } })
    const view = await getProviderByUserId('provider')
    expect(view?.catalog.map(item => item.id)).toEqual(['xof'])
  })
})
