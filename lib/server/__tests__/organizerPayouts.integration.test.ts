// Tests d'INTÉGRATION (vraie base MongoDB) pour lib/server/organizerPayouts.ts
// V1 Bénin : l'ancien Stripe Connect organisateur et la demande manuelle de
// reversement sont refusés. FedaPay Marketplace est configuré via payout-momos.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'

const accountsCreate = vi.fn()
const accountLinksCreate = vi.fn()

vi.mock('../payments/stripeClient', () => ({
  default: {
    accounts: { create: (...args: unknown[]) => accountsCreate(...args) },
    accountLinks: { create: (...args: unknown[]) => accountLinksCreate(...args) },
  },
}))

import { getPayoutStatus, startStripeConnectOnboarding, requestManualPayout } from '../organizer/organizerPayouts'
import User from '@/lib/models/User'
import SellerBalance from '@/lib/models/SellerBalance'
import PayoutRequest from '@/lib/models/PayoutRequest'

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
  await SellerBalance.deleteMany({})
  await PayoutRequest.deleteMany({})
  accountsCreate.mockReset()
  accountLinksCreate.mockReset()
})

async function seedUser(overrides: Partial<Record<string, unknown>> = {}) {
  const user = await User.create({
    email: `${new mongoose.Types.ObjectId().toString()}@test.com`,
    passwordHash: 'x',
    roles: ['organisateur'],
    activeRole: 'organisateur',
    ...overrides,
  })
  return String(user._id)
}

describeIntegration('organizerPayouts (intégration, vraie base) — V1 Bénin sans Stripe Connect', () => {
  it('renvoie mode "none" pour un compte sans pays ni compte Stripe connu', async () => {
    const userId = await seedUser()
    const result = await getPayoutStatus({ id: userId })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.mode).toBe('none')
    expect(result.view.connected).toBe(false)
    expect(result.view.amountDueCents).toBe(0)
  })

  it('ignore les anciens champs Stripe Connect dans le statut V1', async () => {
    const userId = await seedUser({ stripeAccountId: 'acct_legacy', stripeCountry: 'FR', stripeChargesEnabled: true })
    await SellerBalance.create({ sellerUid: userId, amountDueCents: 5000, amountDueXOF: 12000 })

    const result = await getPayoutStatus({ id: userId })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view).toMatchObject({
      mode: 'none',
      connected: false,
      chargesEnabled: false,
      country: 'FR',
      amountDueCents: 5000,
      amountDueXOF: 12000,
    })
  })

  it('refuse la création Stripe Connect, même pour un ancien pays éligible', async () => {
    const userId = await seedUser({ stripeCountry: 'FR' })
    accountsCreate.mockResolvedValue({ id: 'acct_123' })
    accountLinksCreate.mockResolvedValue({ url: 'https://connect.stripe.test/onboarding/acct_123' })

    const result = await startStripeConnectOnboarding({ id: userId }, {})
    expect(result).toEqual({ ok: false, status: 410, error: 'stripe_connect_disabled_v1' })
    expect(accountsCreate).not.toHaveBeenCalled()
    expect(accountLinksCreate).not.toHaveBeenCalled()

    const user = await User.findById(userId).lean()
    expect(user?.stripeAccountId).toBeFalsy()
    expect(user?.stripeCountry).toBe('FR')
  })

  it("refuse la reprise d'un ancien compte Stripe existant", async () => {
    const userId = await seedUser({ stripeAccountId: 'acct_existing', stripeCountry: 'FR' })
    accountLinksCreate.mockResolvedValue({ url: 'https://connect.stripe.test/resume' })

    const result = await startStripeConnectOnboarding({ id: userId }, { returnPath: '/organizer-studio' })
    expect(result).toEqual({ ok: false, status: 410, error: 'stripe_connect_disabled_v1' })
    expect(accountsCreate).not.toHaveBeenCalled()
    expect(accountLinksCreate).not.toHaveBeenCalled()
  })

  it('refuse une demande de reversement manuel organisateur en V1', async () => {
    const userId = await seedUser()
    const result = await requestManualPayout({ id: userId })
    expect(result).toEqual({ ok: false, status: 410, error: 'manual_payout_request_disabled_v1' })
  })

  it('ne crée pas de demande manuelle même si un solde historique existe', async () => {
    const userId = await seedUser()
    await SellerBalance.create({ sellerUid: userId, amountDueCents: 5000, amountDueXOF: 12000 })

    const result = await requestManualPayout({ id: userId })
    expect(result).toEqual({ ok: false, status: 410, error: 'manual_payout_request_disabled_v1' })

    const requests = await PayoutRequest.find({ sellerUid: userId }).lean()
    expect(requests).toHaveLength(0)
  })
})
