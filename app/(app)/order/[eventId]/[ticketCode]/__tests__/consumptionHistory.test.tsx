import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import CommanderClient from '../CommanderClient'
import CommanderPage from '../page'
import type { OrderItem } from '../commanderUtils'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), event: vi.fn(), ticket: vi.fn(), list: vi.fn(), db: vi.fn(),
  refresh: vi.fn(), redirect: vi.fn(() => { throw new Error('redirect') }),
}))
vi.mock('@/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/db/mongoose', () => ({ getDb: mocks.db }))
vi.mock('@/lib/models/Event', () => ({ default: { findById: () => ({ lean: mocks.event }) } }))
vi.mock('@/lib/models/Ticket', () => ({ default: { findOne: () => ({ lean: mocks.ticket }) } }))
vi.mock('@/lib/server/events/eventOrders', () => ({ listOrdersForTicket: mocks.list }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }), redirect: mocks.redirect }))
vi.mock('@/app/components/ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

const eventId = '507f1f77bcf86cd799439011'
const params = Promise.resolve({ eventId, ticketCode: ' t001 ' })
const item = { id: 'one', name: 'Jus', quantity: 2, unitPriceMinor: 500, kind: 'preorder', status: 'sent' } as OrderItem

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: 'buyer' } })
  mocks.event.mockResolvedValue({ name: 'Concert', currency: 'XOF', status: 'cancelled', date: '2020-01-01' })
  mocks.ticket.mockResolvedValue({ eventId, ticketCode: 'T001', userId: 'buyer', revoked: true })
  mocks.list.mockResolvedValue({ ok: true, items: [item] })
})

describe('consumption history only', () => {
  it('renders existing and cancelled lines without purchase or quantity controls', () => {
    const html = renderToStaticMarkup(<CommanderClient eventName="Concert" ticketCode="T001" currency="XOF" initialItems={[item, { ...item, id: 'two', status: 'cancelled' }]} />)
    expect(html).toContain('Mes consommations')
    expect(html).toContain('En attente de remise')
    expect(html).toContain('Annulé')
    expect(html).toContain('Actualiser le suivi')
    expect(html).not.toMatch(/Ajouter|Commander au bar|<input|<form/)
    expect(html.match(/<button/g)).toHaveLength(1)
  })

  it('renders an honest empty state', () => {
    const html = renderToStaticMarkup(<CommanderClient eventName="Concert" ticketCode="T001" currency="XOF" initialItems={[]} />)
    expect(html).toContain('Aucune consommation enregistrée')
  })

  it('keeps history readable for its owner after cancellation or ticket revocation', async () => {
    const html = renderToStaticMarkup(await CommanderPage({ params }))
    expect(html).toContain('Jus')
    expect(mocks.list).toHaveBeenCalledWith({ id: 'buyer' }, { eventId, ticketId: 'T001' })
  })

  it('does not expose another buyer history', async () => {
    mocks.ticket.mockResolvedValue({ eventId, ticketCode: 'T001', userId: 'other' })
    const html = renderToStaticMarkup(await CommanderPage({ params }))
    expect(html).toContain('Suivi indisponible')
    expect(html).not.toContain('Jus')
    expect(mocks.list).not.toHaveBeenCalled()
  })

  it('does not label a failed read as an empty order', async () => {
    mocks.list.mockResolvedValue({ ok: false, error: 'forbidden' })
    const html = renderToStaticMarkup(await CommanderPage({ params }))
    expect(html).toContain('Suivi indisponible')
    expect(html).not.toContain('Aucune consommation')
  })

  it('requires authentication before reading data', async () => {
    mocks.auth.mockResolvedValue(null)
    await expect(CommanderPage({ params })).rejects.toThrow('redirect')
    expect(mocks.db).not.toHaveBeenCalled()
    expect(mocks.list).not.toHaveBeenCalled()
  })
})
