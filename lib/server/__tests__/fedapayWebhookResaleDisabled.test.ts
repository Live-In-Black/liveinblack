import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  releaseOrder: vi.fn(async () => ({ ok: true })),
  fulfillOrder: vi.fn(),
  fulfillAgentSaleOrder: vi.fn(),
  releaseAgentSaleOrder: vi.fn(),
  activateSeatHold: vi.fn(),
  completeSeatHold: vi.fn(),
  releaseSeatHoldDepositOrder: vi.fn(),
  handleFedapaySubscriptionPayment: vi.fn(),
  finalizeFedapayBoost: vi.fn(),
  releaseBoostSlotIfPending: vi.fn(),
  notifyUserById: vi.fn(),
  orderFindOne: vi.fn(),
  userFindOne: vi.fn(),
  boostSlotFindOne: vi.fn(),
}))

vi.mock('@/lib/db/mongoose', () => ({ getDb: vi.fn(async () => undefined) }))
vi.mock('@/lib/server/observability', () => ({ runObservedRoute: vi.fn((_req, _meta, handler) => handler()) }))
vi.mock('@/lib/server/payments/fedapayClient', () => ({
  verifyWebhookSignature: vi.fn(() => true),
  isApprovedTransactionEvent: vi.fn(() => true),
}))
vi.mock('@/lib/server/payments/fulfillOrder', () => ({ fulfillOrder: mocks.fulfillOrder }))
vi.mock('@/lib/server/events/orders', () => ({ releaseOrder: mocks.releaseOrder }))
vi.mock('@/lib/server/agent/agentSales', () => ({
  fulfillAgentSaleOrder: mocks.fulfillAgentSaleOrder,
  releaseAgentSaleOrder: mocks.releaseAgentSaleOrder,
}))
vi.mock('@/lib/server/events/seatHolds', () => ({
  activateSeatHold: mocks.activateSeatHold,
  completeSeatHold: mocks.completeSeatHold,
  releaseSeatHoldDepositOrder: mocks.releaseSeatHoldDepositOrder,
}))
vi.mock('@/lib/server/provider/providerSubscriptions', () => ({ handleFedapaySubscriptionPayment: mocks.handleFedapaySubscriptionPayment }))
vi.mock('@/lib/server/payments/finalizeBoost', () => ({ finalizeFedapayBoost: mocks.finalizeFedapayBoost }))
vi.mock('@/lib/server/events/boostSlots', () => ({ releaseBoostSlotIfPending: mocks.releaseBoostSlotIfPending }))
vi.mock('@/lib/server/emails/notify', () => ({ notifyUserById: mocks.notifyUserById }))
vi.mock('@/lib/server/emails', () => ({ paymentFailedEmail: vi.fn(() => ({ subject: 'failed', html: '', text: '' })) }))
vi.mock('@/lib/models/User', () => ({
  default: { findOne: (...args: unknown[]) => mocks.userFindOne(...args) },
}))
vi.mock('@/lib/models/BoostSlot', () => ({
  default: { findOne: (...args: unknown[]) => mocks.boostSlotFindOne(...args) },
}))
vi.mock('@/lib/models/Event', () => ({
  default: { findById: vi.fn(() => ({ select: vi.fn(() => ({ lean: vi.fn(async () => null) })) })) },
}))
vi.mock('@/lib/models/Order', () => ({
  default: { findOne: (...args: unknown[]) => mocks.orderFindOne(...args) },
}))

describe('webhook FedaPay V1 revente desactivee', () => {
  it('ignore et libere une ancienne commande resale approuvee sans transfert de billet', async () => {
    process.env.FEDAPAY_WEBHOOK_SECRET = 'wh_test'
    mocks.userFindOne.mockReturnValue({ select: vi.fn(() => ({ lean: vi.fn(async () => null) })) })
    mocks.boostSlotFindOne.mockReturnValue({ select: vi.fn(() => ({ lean: vi.fn(async () => null) })) })
    mocks.orderFindOne.mockReturnValue({ lean: vi.fn(async () => ({ _id: 'order-resale-1', kind: 'resale' })) })

    const { POST } = await import('@/app/api/webhooks/fedapay/route')
    const response = await POST(
      new Request('https://liveinblack.test/api/webhooks/fedapay', {
        method: 'POST',
        headers: { 'x-fedapay-signature': 'test' },
        body: JSON.stringify({ name: 'transaction.approved', entity: { id: 123, status: 'approved', amount: 5000 } }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true, ignored: 'resale_disabled_v1' })
    expect(mocks.releaseOrder).toHaveBeenCalledWith('order-resale-1', null)
    expect(mocks.fulfillOrder).not.toHaveBeenCalled()
    expect(mocks.fulfillAgentSaleOrder).not.toHaveBeenCalled()
  })
})
