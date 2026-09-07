import { beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import EventOrder from '@/lib/models/EventOrder'
import Ticket from '@/lib/models/Ticket'
import { serveEventOrderItem, type ServeOrderItemDependencies } from '../events/eventOrderServeItemService'

vi.mock('../../models/EventOrder', () => ({
  default: {
    findOne: vi.fn(),
  },
}))
vi.mock('../../models/Ticket', () => ({ default: { findOneAndUpdate: vi.fn() } }))

describe('eventOrderServeItemService', () => {
  const caller = { id: 'u1' }

  let deps: ServeOrderItemDependencies
  let session: {
    withTransaction: ReturnType<typeof vi.fn>
    endSession: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    session = {
      withTransaction: vi.fn(async (work: () => Promise<unknown>) => work()),
      endSession: vi.fn().mockResolvedValue(undefined),
    }
    deps = {
      loadEventContext: vi.fn().mockResolvedValue({
        ok: true,
        ctx: { rank: 2, role: 'serveur', event: {} as never },
      }),
      resolveCallerName: vi.fn().mockResolvedValue('Alice A'),
      appendLog: vi.fn().mockResolvedValue(undefined),
      toItemView: vi.fn((item) => ({ id: item.id, status: item.status, servedBy: item.servedBy }) as never),
      startSession: vi.fn().mockResolvedValue(session as unknown as mongoose.ClientSession),
    }
    vi.clearAllMocks()
    vi.mocked(Ticket.findOneAndUpdate).mockResolvedValue({ ticketCode: 'T1' } as never)
  })

  it('refuse un non staff', async () => {
    vi.mocked(deps.loadEventContext).mockResolvedValueOnce({
      ok: true,
      ctx: { rank: 0, role: 'client', event: {} as never },
    })

    await expect(
      serveEventOrderItem(caller, { eventId: 'event-1', itemId: 'item-1' }, deps),
    ).resolves.toEqual({
      ok: false,
      status: 403,
      error: 'serve_staff_only',
    })
  })

  it('refuse une ligne annulée', async () => {
    vi.mocked(EventOrder.findOne).mockReturnValueOnce({
      session: vi.fn().mockResolvedValue({
        items: [{ id: 'item-1', status: 'cancelled' }],
      }),
    } as never)

    await expect(
      serveEventOrderItem(caller, { eventId: 'event-1', itemId: 'item-1' }, deps),
    ).resolves.toEqual({
      ok: false,
      status: 409,
      error: 'item_cancelled',
    })
  })

  it('retourne alreadyServed sans rejournaliser', async () => {
    vi.mocked(EventOrder.findOne).mockReturnValueOnce({
      session: vi.fn().mockResolvedValue({
        items: [{ id: 'item-1', status: 'served', servedAt: new Date() }],
      }),
    } as never)

    await expect(
      serveEventOrderItem(caller, { eventId: 'event-1', itemId: 'item-1' }, deps),
    ).resolves.toEqual({
      ok: true,
      alreadyServed: true,
    })
    expect(deps.appendLog).not.toHaveBeenCalled()
  })

  it('sert une ligne et écrit le log', async () => {
    const item: { id: string; status: string; servedAt: Date | null; ticketId: string; name: string; servedBy?: string } = {
      id: 'item-1',
      status: 'sent',
      servedAt: null,
      ticketId: 'T1',
      name: 'Coca',
    }
    const save = vi.fn().mockResolvedValue(undefined)
    vi.mocked(EventOrder.findOne).mockReturnValueOnce({
      session: vi.fn().mockResolvedValue({
        items: [item],
        save,
      }),
    } as never)

    const result = await serveEventOrderItem(caller, { eventId: 'event-1', itemId: 'item-1' }, deps)

    expect(result.ok).toBe(true)
    if (!result.ok || result.alreadyServed) return
    expect(item.status).toBe('served')
    expect(item.servedBy).toBe('u1')
    expect(Ticket.findOneAndUpdate).toHaveBeenCalledWith(
      { ticketCode: 'T1', eventId: 'event-1', paid: true, revoked: { $ne: true } },
      { $inc: { consumptionRevision: 1 } },
      { session, returnDocument: 'after' },
    )
    expect(deps.appendLog).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        action: 'serve',
        ticketId: 'T1',
        itemName: 'Coca',
      }),
      session as unknown as mongoose.ClientSession,
    )
  })

  it('ne sert ni ne journalise une ligne dont le billet est indisponible', async () => {
    const item = { id: 'item-1', status: 'sent', ticketId: 'T1', servedAt: null }
    const save = vi.fn()
    vi.mocked(EventOrder.findOne).mockReturnValueOnce({ session: vi.fn().mockResolvedValue({ items: [item], save }) } as never)
    vi.mocked(Ticket.findOneAndUpdate).mockResolvedValueOnce(null)
    expect(await serveEventOrderItem(caller, { eventId: 'event-1', itemId: 'item-1' }, deps))
      .toEqual({ ok: false, status: 409, error: 'ticket_unavailable' })
    expect(item.status).toBe('sent')
    expect(item.servedAt).toBeNull()
    expect(save).not.toHaveBeenCalled()
    expect(deps.appendLog).not.toHaveBeenCalled()
  })
})
