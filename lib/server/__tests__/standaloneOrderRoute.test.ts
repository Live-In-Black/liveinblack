import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/event-orders/add/route'
import { addOrderItem } from '../events/eventOrders'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('../events/eventOrders', () => ({ addOrderItem: vi.fn() }))
beforeEach(() => vi.clearAllMocks())
describe('V1 precommandes uniquement avec billet', () => {
  it('conserve le refus sans authentification', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    expect((await POST()).status).toBe(401)
    expect(addOrderItem).not.toHaveBeenCalled()
  })
  it.each(['client', 'organisateur', 'agent'])('refuse une commande autonome pour %s sans creation', async role => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'test-only', roles: [role] } } as never)
    const response = await POST()
    expect(response.status).toBe(410)
    expect(await response.json()).toMatchObject({ error: 'standalone_orders_disabled_v1' })
    expect(addOrderItem).not.toHaveBeenCalled()
  })
})
