// Tests d'INTÉGRATION (vraie base MongoDB) pour lib/server/providerBilling.ts
// — remplace api/provider-billing-region.js. Pays de facturation prestataire
// (rail EUR/Stripe vs XOF/FedaPay), un seul champ sur User (pas de collection
// séparée comme le legacy `provider_billing/{uid}`).
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { getProviderBillingContext, setProviderBillingRegion } from '../provider/providerBilling'
import User from '@/lib/models/User'
import Application from '@/lib/models/Application'

const RUN_INTEGRATION = Boolean(process.env.MONGODB_URI)
const describeIntegration = describe.skipIf(!RUN_INTEGRATION)
const TEST_URI = process.env.MONGODB_URI || ''

beforeAll(async () => {
  if (!RUN_INTEGRATION) return
  await mongoose.connect(TEST_URI)
}, 20000)

afterAll(async () => {
  if (!RUN_INTEGRATION) return
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

beforeEach(async () => {
  if (!RUN_INTEGRATION) return
  await User.deleteMany({})
  await Application.deleteMany({})
})

async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    passwordHash: 'x',
    firstName: 'Ada',
    lastName: 'Lovelace',
    roles: ['prestataire'],
    activeRole: 'prestataire',
    ...overrides,
  })
}

describeIntegration('getProviderBillingContext', () => {
  it("défaut à 'benin'/XOF si aucun pays de facturation ni dossier prestataire", async () => {
    const user = await seedUser()
    const context = await getProviderBillingContext({ id: user.id })
    expect(context).toEqual({ billingRegionId: 'benin', currency: 'XOF', canChange: true })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })

  it('ignore les anciens pays du dossier prestataire et force Benin/XOF', async () => {
    const user = await seedUser()
    await Application.create({ userId: user.id, type: 'prestataire', status: 'submitted', formData: { pays: 'Togo' } })

    const context = await getProviderBillingContext({ id: user.id })
    expect(context.billingRegionId).toBe('benin')
    expect(context.currency).toBe('XOF')
  })

  it('reste Benin/XOF après resoumission même si le dossier mentionne un ancien pays', async () => {
    const user = await seedUser()
    const application = await Application.create({ userId: user.id, type: 'prestataire', status: 'submitted', formData: { pays: 'France' } })
    await Application.updateOne(
      { _id: application._id },
      {
        $set: {
          status: 'resubmitted',
          formData: { pays: 'Togo' },
          updatedAt: new Date('2026-08-19T10:00:00.000Z'),
        },
      }
    )

    const context = await getProviderBillingContext({ id: user.id })
    expect(context.billingRegionId).toBe('benin')
    expect(context.currency).toBe('XOF')
  })

  it('migre un ancien pays de facturation déjà posé vers Benin/XOF', async () => {
    const user = await seedUser({ providerBillingRegionId: 'senegal' })
    await Application.create({ userId: user.id, type: 'prestataire', status: 'submitted', formData: { pays: 'Togo' } })

    const context = await getProviderBillingContext({ id: user.id })
    expect(context.billingRegionId).toBe('benin')

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })

  it('persiste Benin si la valeur stockée est invalide', async () => {
    const user = await seedUser({ providerBillingRegionId: 'atlantide' })
    await Application.create({ userId: user.id, type: 'prestataire', status: 'submitted', formData: { pays: 'Sénégal' } })

    const context = await getProviderBillingContext({ id: user.id })
    expect(context).toEqual({ billingRegionId: 'benin', currency: 'XOF', canChange: true })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })

  it('canChange=false si un abonnement prestataire est actif', async () => {
    const user = await seedUser({ prestataireSubActive: true, providerBillingRegionId: 'france' })
    const context = await getProviderBillingContext({ id: user.id })
    expect(context.canChange).toBe(false)
  })
})

describeIntegration('setProviderBillingRegion', () => {
  it('change le pays de facturation quand aucun abonnement actif', async () => {
    const user = await seedUser({ providerBillingRegionId: 'france' })
    const result = await setProviderBillingRegion({ id: user.id }, 'benin')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context).toEqual({ billingRegionId: 'benin', currency: 'XOF', canChange: true })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })

  it('normalise la saisie Benin avant écriture', async () => {
    const user = await seedUser({ providerBillingRegionId: 'france' })
    const result = await setProviderBillingRegion({ id: user.id }, '  Bénin ')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.context).toEqual({ billingRegionId: 'benin', currency: 'XOF', canChange: true })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })

  it('refuse un pays de facturation invalide', async () => {
    const user = await seedUser()
    const result = await setProviderBillingRegion({ id: user.id }, 'atlantide')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('invalid_billing_region')
  })

  it('refuse un ancien pays hors Bénin même tant que l’abonnement est actif', async () => {
    const user = await seedUser({ providerBillingRegionId: 'france', prestataireSubActive: true })
    const result = await setProviderBillingRegion({ id: user.id }, 'togo')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('benin_launch_region_required')

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('france')
  })

  it('autorise de re-poser Benin même abonnement actif', async () => {
    const user = await seedUser({ providerBillingRegionId: 'france', prestataireSubActive: true })
    const result = await setProviderBillingRegion({ id: user.id }, 'benin')
    expect(result.ok).toBe(true)

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.providerBillingRegionId).toBe('benin')
  })
})
