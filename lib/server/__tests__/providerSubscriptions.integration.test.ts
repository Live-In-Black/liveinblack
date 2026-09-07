// Tests d'INTÉGRATION (vraie base MongoDB) pour lib/server/providerSubscriptions.ts
// — abonnement prestataire V1 XOF/FedaPay, avec rail Stripe historique ferme.
// Stripe et FedaPay sont mockés (aucune
// vraie clé de test dans cet environnement, même convention que
// organizerPayouts.integration.test.ts) ; l'envoi d'email est mocké pour
// vérifier le comptage sans dépendre de RESEND_API_KEY.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'

const checkoutSessionsCreate = vi.fn()
const checkoutSessionsRetrieve = vi.fn()
const subscriptionsRetrieve = vi.fn()

vi.mock('../payments/stripeClient', () => ({
  default: {
    checkout: { sessions: { create: (...a: unknown[]) => checkoutSessionsCreate(...a), retrieve: (...a: unknown[]) => checkoutSessionsRetrieve(...a) } },
    subscriptions: { retrieve: (...a: unknown[]) => subscriptionsRetrieve(...a) },
  },
}))

const createTransaction = vi.fn()
const createToken = vi.fn()

vi.mock('../payments/fedapayClient', () => ({
  createTransaction: (...a: unknown[]) => createTransaction(...a),
  createToken: (...a: unknown[]) => createToken(...a),
  transactionAmountMatches: (paid: unknown, expected: unknown) => {
    const p = Math.round(Number(paid) || 0)
    const e = Math.round(Number(expected) || 0)
    return e > 0 && p === e
  },
}))

const sendEmail = vi.fn()
vi.mock('../email', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }))

import {
  getMySubscriptionOverview,
  createStripeSubscriptionCheckout,
  confirmStripeSubscriptionCheckout,
  handleStripeSubscriptionCheckoutCompleted,
  handleStripeSubscriptionEvent,
  handleStripeSubscriptionInvoicePaid,
  createFedapaySubscriptionCheckout,
  handleFedapaySubscriptionPayment,
  runSubscriptionReminderCron,
} from '../provider/providerSubscriptions'
import { PROVIDER_SUB } from '@/lib/shared/providerSubscription'
import User from '@/lib/models/User'
import ProviderProfile from '@/lib/models/ProviderProfile'
import PaymentAlert from '@/lib/models/PaymentAlert'
import CronLock from '@/lib/models/CronLock'
import SubscriptionPayment from '@/lib/models/SubscriptionPayment'

const RUN_INTEGRATION = Boolean(process.env.MONGODB_URI)
const describeIntegration = describe.skipIf(!RUN_INTEGRATION)
const TEST_URI = process.env.MONGODB_URI || ''
const DAY = 24 * 60 * 60 * 1000

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
  vi.clearAllMocks()
  if (!RUN_INTEGRATION) return
  await User.deleteMany({})
  await ProviderProfile.deleteMany({})
  await PaymentAlert.deleteMany({})
  await CronLock.deleteMany({})
  await SubscriptionPayment.deleteMany({})
})

async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    passwordHash: 'x',
    firstName: 'Ada',
    lastName: 'Lovelace',
    roles: ['prestataire'],
    activeRole: 'prestataire',
    providerBillingRegionId: 'france',
    ...overrides,
  })
}

describeIntegration('getMySubscriptionOverview', () => {
  it('reflète un compte sans abonnement', async () => {
    const user = await seedUser()
    const overview = await getMySubscriptionOverview({ id: user.id })
    expect(overview.currency).toBe('XOF')
    expect(overview.prestataireSubActive).toBe(false)
    expect(overview.prestataireSubRail).toBeNull()
  })
})

describeIntegration('createStripeSubscriptionCheckout (historique ferme V1)', () => {
  it('refuse toujours sans creer de session Stripe', async () => {
    const user = await seedUser({ providerBillingRegionId: 'togo' })
    const result = await createStripeSubscriptionCheckout({ id: user.id, email: user.email })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(410)
    expect(result.error).toBe('stripe_subscription_disabled_v1')
    expect(checkoutSessionsCreate).not.toHaveBeenCalled()
  })

  it('ne reactualise pas un ancien abonnement Stripe actif', async () => {
    const user = await seedUser({ prestataireSubActive: true, prestataireSubStatus: 'active' })
    const result = await createStripeSubscriptionCheckout({ id: user.id, email: user.email })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('stripe_subscription_disabled_v1')
    expect(checkoutSessionsCreate).not.toHaveBeenCalled()
  })
})

describeIntegration('confirmStripeSubscriptionCheckout (historique ferme V1)', () => {
  it('refuse toujours sans interroger Stripe', async () => {
    const user = await seedUser()
    const result = await confirmStripeSubscriptionCheckout({ id: user.id }, 'cs_test_1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(410)
    expect(result.error).toBe('stripe_subscription_disabled_v1')
    expect(checkoutSessionsRetrieve).not.toHaveBeenCalled()
    expect(subscriptionsRetrieve).not.toHaveBeenCalled()
  })
})

describeIntegration('webhook Stripe abonnement historique', () => {
  it('ignore checkout.session.completed sans activer le prestataire', async () => {
    const user = await seedUser()
    await handleStripeSubscriptionCheckoutCompleted({
      id: 'cs_1', metadata: { uid: user.id, type: 'prestataire_subscription' },
      client_reference_id: user.id, subscription: 'sub_1', customer: 'cus_1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.prestataireSubActive).not.toBe(true)
    expect(fresh?.stripeSubscriptionId).toBeUndefined()
  })

  it('ignore customer.subscription.deleted sans muter le profil', async () => {
    const user = await seedUser({ prestataireSubActive: true, prestataireSubRail: 'stripe', stripeSubscriptionId: 'sub_1' })
    await ProviderProfile.create({ userId: user.id, name: 'DJ Test', subscriptionActive: true, subscriptionStatus: 'active' })

    await handleStripeSubscriptionEvent(
      { id: 'sub_1', status: 'canceled', customer: 'cus_1', metadata: { uid: user.id }, items: { data: [] } } as never,
      true
    )

    const freshUser = await User.findById(user.id).lean()
    expect(freshUser?.prestataireSubActive).toBe(true)
    expect(freshUser?.prestataireSubStatus).toBeUndefined()

    const freshProfile = await ProviderProfile.findOne({ userId: user.id }).lean()
    expect(freshProfile?.subscriptionActive).toBe(true)
    expect(freshProfile?.subscriptionStatus).toBe('active')
  })
})

describeIntegration('createFedapaySubscriptionCheckout (rail XOF)', () => {
  it('accepte meme si une ancienne region EUR est stockee, car la V1 force Benin/XOF', async () => {
    const user = await seedUser({ providerBillingRegionId: 'france' })
    createTransaction.mockResolvedValue({ id: 998, status: 'pending', amount: PROVIDER_SUB.price })
    createToken.mockResolvedValue({ url: 'https://fedapay.test/pay/998', token: 'tok' })

    const result = await createFedapaySubscriptionCheckout({ id: user.id, email: user.email })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url).toBe('https://fedapay.test/pay/998')
  })

  it('crée une transaction FedaPay et pose le registre pendingFedapaySubTxnId', async () => {
    const user = await seedUser({ providerBillingRegionId: 'togo' })
    createTransaction.mockResolvedValue({ id: 999, status: 'pending', amount: PROVIDER_SUB.price })
    createToken.mockResolvedValue({ url: 'https://fedapay.test/pay/999', token: 'tok' })

    const result = await createFedapaySubscriptionCheckout({ id: user.id, email: user.email })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url).toBe('https://fedapay.test/pay/999')
    expect(result.transactionId).toBe('999')

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.pendingFedapaySubTxnId).toBe('999')
  })
})

describeIntegration('handleFedapaySubscriptionPayment', () => {
  it('crée une PaymentAlert et ne mirrore rien si le montant ne correspond pas', async () => {
    const user = await seedUser({ providerBillingRegionId: 'togo', pendingFedapaySubTxnId: '111' })
    await handleFedapaySubscriptionPayment(user.id, { id: 111, amount: 1 })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.prestataireSubActive).toBe(false)
    const alert = await PaymentAlert.findOne({ key: 'fedapay_sub_111' }).lean()
    expect(alert?.reason).toBe('sub_amount_mismatch')
  })

  it("prolonge l'abonnement de PROVIDER_SUB.periodDays jours pour un premier paiement (pas de ProviderProfile)", async () => {
    const user = await seedUser({ providerBillingRegionId: 'togo', pendingFedapaySubTxnId: '112' })
    const before = Date.now()
    await handleFedapaySubscriptionPayment(user.id, { id: 112, amount: PROVIDER_SUB.price })

    const fresh = await User.findById(user.id).lean()
    expect(fresh?.prestataireSubActive).toBe(true)
    expect(fresh?.prestataireSubRail).toBe('fedapay')
    expect(fresh?.pendingFedapaySubTxnId).toBeNull()
    expect(new Date(fresh!.prestataireSubEnd!).getTime()).toBeGreaterThan(before + (PROVIDER_SUB.periodDays - 1) * DAY)
    expect(await SubscriptionPayment.countDocuments({ userId: user.id, externalId: '112' })).toBe(1)
    await handleFedapaySubscriptionPayment(user.id, { id: 112, amount: PROVIDER_SUB.price })
    expect(await SubscriptionPayment.countDocuments({ userId: user.id, externalId: '112' })).toBe(1)
  })

  it('prolonge depuis l’expiration actuelle (pas depuis maintenant) pour un renouvellement anticipé', async () => {
    const user = await seedUser({ providerBillingRegionId: 'togo', pendingFedapaySubTxnId: '113' })
    const futureExpiry = Date.now() + 10 * DAY
    await ProviderProfile.create({
      userId: user.id, name: 'DJ Test', subscriptionActive: true,
      subscriptionStartedAt: new Date(Date.now() - 20 * DAY),
      subscriptionExpiresAt: new Date(futureExpiry),
      gracePeriodEndsAt: new Date(futureExpiry + PROVIDER_SUB.graceDays * DAY),
      subscriptionStatus: 'active',
    })

    await handleFedapaySubscriptionPayment(user.id, { id: 113, amount: PROVIDER_SUB.price })

    const freshProfile = await ProviderProfile.findOne({ userId: user.id }).lean()
    const expectedExpiry = futureExpiry + PROVIDER_SUB.periodDays * DAY
    expect(freshProfile?.subscriptionExpiresAt?.getTime()).toBeCloseTo(expectedExpiry, -2)
  })
})

describeIntegration('historique Stripe', () => {
  it('ignore invoice.paid pour ne plus activer de registre Stripe V1', async () => {
    const user = await seedUser({ stripeSubscriptionId: 'sub_history_1' })
    const invoice = {
      id: 'in_history_1', amount_paid: 999, created: Math.floor(Date.now() / 1000), currency: 'eur', invoice_pdf: 'https://stripe.test/receipt.pdf', hosted_invoice_url: null,
      status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
      parent: { subscription_details: { subscription: 'sub_history_1', metadata: { uid: user.id } } },
    }
    await handleStripeSubscriptionInvoicePaid(invoice as never)
    await handleStripeSubscriptionInvoicePaid(invoice as never)
    const overview = await getMySubscriptionOverview({ id: user.id })
    expect(overview.payments).toHaveLength(0)
  })
})

describeIntegration('runSubscriptionReminderCron', () => {
  it('envoie les rappels dus, masque les profils expirés et ne renvoie pas deux fois le même jalon', async () => {
    sendEmail.mockResolvedValue({ ok: true })

    const soonUser = await seedUser({ providerBillingRegionId: 'togo' })
    await ProviderProfile.create({
      userId: soonUser.id, name: 'Bientôt expiré', subscriptionActive: true,
      subscriptionExpiresAt: new Date(Date.now() + 2 * DAY),
      gracePeriodEndsAt: new Date(Date.now() + 5 * DAY),
      subscriptionStatus: 'active',
    })

    const expiredUser = await seedUser({ providerBillingRegionId: 'togo', prestataireSubActive: true })
    await ProviderProfile.create({
      userId: expiredUser.id, name: 'Expiré', subscriptionActive: true,
      subscriptionExpiresAt: new Date(Date.now() - 10 * DAY),
      gracePeriodEndsAt: new Date(Date.now() - 7 * DAY),
      subscriptionStatus: 'grace',
    })

    const result = await runSubscriptionReminderCron()
    expect(result.scanned).toBe(2)
    expect(result.hidden).toBe(1)
    expect(result.reminders).toBeGreaterThanOrEqual(2)
    expect(sendEmail).toHaveBeenCalled()

    const freshExpired = await ProviderProfile.findOne({ userId: expiredUser.id }).lean()
    expect(freshExpired?.subscriptionActive).toBe(false)
    const freshExpiredUser = await User.findById(expiredUser.id).lean()
    expect(freshExpiredUser?.prestataireSubActive).toBe(false)

    // Deuxième passage le même jour : les jalons déjà envoyés ce cycle ne repartent pas.
    sendEmail.mockClear()
    const second = await runSubscriptionReminderCron()
    expect(second.reminders).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
