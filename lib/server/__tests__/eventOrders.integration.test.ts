// Integration V1: standalone creation is disabled; historical order fixtures
// preserve tests of real authorization, fulfillment, accounting and audit.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import type { AddOrderItemInput } from '../events/eventOrderAddItemService'
import {
  addOrderItem,
  updateOrderItemQuantity,
  serveOrderItem,
  payTicketOrders,
  cancelOrderItem,
  removeOrderItem,
  materializeTicketOrders,
  listOrdersForTicket,
  listOrdersForEvent,
  getOrderLog,
} from '../events/eventOrders'
import Event from '@/lib/models/Event'
import Ticket from '@/lib/models/Ticket'
import User from '@/lib/models/User'
import EventStaff from '@/lib/models/EventStaff'
import EventOrder from '@/lib/models/EventOrder'
import EventOrderLog from '@/lib/models/EventOrderLog'

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
  await Promise.all([
    Event.deleteMany({}),
    Ticket.deleteMany({}),
    User.deleteMany({}),
    EventStaff.deleteMany({}),
    EventOrder.deleteMany({}),
    EventOrderLog.deleteMany({}),
  ])
})

// userId/organizerId/staff ids doivent être de vrais ObjectId Mongo (comme en
// prod, où ils viennent toujours de session.user.id = String(user._id)) —
// resolveCallerName() dans eventOrders.ts fait un User.findById(caller.id)
// sur CHAQUE appel mutant, donc un id de caller factice (chaîne arbitraire)
// ferait planter le test avec un CastError, pas juste échouer l'assertion.
async function seedUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    passwordHash: 'x',
    firstName: 'Prenom',
    lastName: 'Nom',
    roles: ['client'],
    activeRole: 'client',
    ...overrides,
  })
}

async function seedEvent(ownerId: string, overrides: Record<string, unknown> = {}) {
  return Event.create({
    name: 'Test Event',
    date: '2099-01-01',
    time: '22:00',
    endTime: '05:00',
    currency: 'XOF',
    createdBy: ownerId,
    organizerId: ownerId,
    places: [
      { id: 'std', type: 'Standard', price: 2000, available: 10, total: 10, included: [] },
      { id: 'vip', type: 'VIP', price: 10000, available: 5, total: 5, included: [{ name: 'Coca', qty: 2 }] },
    ],
    menu: [
      { name: 'Coca', price: 500 },
      { name: 'Champagne', price: 15000 },
    ],
    ...overrides,
  })
}

async function seedTicket(eventId: string, userId: string, overrides: Record<string, unknown> = {}) {
  return Ticket.create({
    ticketCode: `TICK${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    eventId,
    eventName: 'Test Event',
    eventDate: '1 janvier 2099',
    place: 'Standard',
    placePrice: 2000,
    totalPrice: 2000,
    currency: 'XOF',
    paid: true,
    userId,
    preorders: [],
    ...overrides,
  })
}

async function addStaff(eventId: string, uid: string, role: 'scan' | 'serveur' | 'manager' | 'dj') {
  await EventStaff.findOneAndUpdate(
    { eventId },
    { $set: { [`roster.${uid}`]: { role, name: '', addedBy: 'test-setup', addedAt: new Date() } } },
    { upsert: true }
  )
}

// Existing unpaid orders are test fixtures, not new purchases through a disabled API.
async function seedHistoricalItem(caller: { id: string }, input: AddOrderItemInput) {
  const event = await Event.findById(input.eventId).lean()
  const menu = event?.menu?.find((entry) => entry.name === input.menuItemId)
  if (!menu) throw new Error('missing fixture menu item')
  const item = {
    id: randomUUID(), ticketId: input.ticketId, menuItemId: input.menuItemId,
    name: menu.name, quantity: input.quantity, unitPriceMinor: menu.price ?? 0,
    kind: 'order', status: 'sent', addedBy: caller.id, addedByName: 'Historical buyer',
  }
  await EventOrder.findOneAndUpdate(
    { eventId: input.eventId },
    { $setOnInsert: { eventId: input.eventId }, $push: { items: item } },
    { upsert: true },
  )
  await EventOrderLog.findOneAndUpdate(
    { eventId: input.eventId },
    { $setOnInsert: { eventId: input.eventId }, $push: { entries: {
      id: randomUUID(), ts: new Date('2026-08-01T12:00:00Z'), actorId: caller.id,
      action: 'add', itemId: item.id, note: 'historical_fixture',
    } } },
    { upsert: true },
  )
  return { ok: true as const, item }
}

describeIntegration('eventOrders (intégration, transaction réelle)', () => {
  it('preserve les precommandes et inclus contre la suppression par tous les agents', async () => {
    const owner = await seedUser()
    const holder = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id, { place: 'VIP', preorders: [{ name: 'Champagne', price: 15000, qty: 1 }] })
    await materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    const before = await EventOrder.findOne({ eventId: event.id }).lean()
    const logBefore = await EventOrderLog.findOne({ eventId: event.id }).lean()
    expect(before?.items).toHaveLength(2)
    const callers = [owner]
    for (const role of ['scan', 'serveur', 'manager'] as const) {
      const agent = await seedUser()
      await addStaff(event.id, agent.id, role)
      callers.push(agent)
    }
    for (const caller of callers) {
      for (const item of before!.items) {
        expect(await removeOrderItem({ id: caller.id }, { eventId: event.id, itemId: item.id }))
          .toEqual({ ok: false, status: 409, error: 'purchased_item_locked' })
      }
    }
    expect(await EventOrder.findOne({ eventId: event.id }).lean()).toEqual(before)
    expect(await EventOrderLog.findOne({ eventId: event.id }).lean()).toEqual(logBefore)
  })

  it.each([{ paid: false }, { revoked: true }])('refuse la remise apres invalidation du billet (%j)', async (state) => {
    const owner = await seedUser()
    const holder = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id, { preorders: [{ name: 'Coca', price: 500, qty: 1 }] })
    expect((await materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode })).ok).toBe(true)
    await Ticket.updateOne({ _id: ticket._id }, { $set: state })
    const before = await EventOrder.findOne({ eventId: event.id }).lean()
    const logBefore = await EventOrderLog.findOne({ eventId: event.id }).lean()
    expect(before?.items).toHaveLength(1)
    expect(await serveOrderItem({ id: owner.id }, { eventId: event.id, itemId: before!.items[0].id }))
      .toEqual({ ok: false, status: 409, error: 'ticket_unavailable' })
    expect(await EventOrder.findOne({ eventId: event.id }).lean()).toEqual(before)
    expect(await EventOrderLog.findOne({ eventId: event.id }).lean()).toEqual(logBefore)
  })

  it('deux remises concurrentes produisent une seule remise et un seul journal', async () => {
    const owner = await seedUser()
    const holder = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id, { preorders: [{ name: 'Coca', price: 500, qty: 1 }] })
    await materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    const order = await EventOrder.findOne({ eventId: event.id }).lean()
    const input = { eventId: event.id, itemId: order!.items[0].id }
    const results = await Promise.all([serveOrderItem({ id: owner.id }, input), serveOrderItem({ id: owner.id }, input)])
    expect(results.every((result) => result.ok)).toBe(true)
    expect(results.filter((result) => result.ok && result.alreadyServed)).toHaveLength(1)
    const log = await EventOrderLog.findOne({ eventId: event.id }).lean()
    expect(log?.entries.filter((entry) => entry.action === 'serve')).toHaveLength(1)
    expect((await EventOrder.findOne({ eventId: event.id }).lean())?.items[0].status).toBe('served')
  })

  it.each([{ paid: false }, { revoked: true }])('ne prepare aucune consommation pour un billet indisponible (%j)', async (state) => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id, { ...state, preorders: [{ name: 'Coca', price: 500, qty: 1 }] })
    const before = await Ticket.findById(ticket.id).lean()
    expect(await materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode }))
      .toEqual({ ok: false, status: 409, error: 'ticket_unavailable' })
    expect(await EventOrder.countDocuments()).toBe(0)
    expect(await EventOrderLog.countDocuments()).toBe(0)
    expect(await Ticket.findById(ticket.id).lean()).toEqual(before)
  })

  it('refuse une revocation survenue juste avant le verrou transactionnel', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id, { preorders: [{ name: 'Coca', price: 500, qty: 1 }] })
    const original = Ticket.findOneAndUpdate.bind(Ticket)
    const spy = vi.spyOn(Ticket, 'findOneAndUpdate').mockImplementationOnce(((...args: Parameters<typeof original>) => {
      return Ticket.updateOne({ _id: ticket._id }, { $set: { revoked: true } }).then(() => original(...args))
    }) as never)
    try {
      expect(await materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode }))
        .toEqual({ ok: false, status: 409, error: 'ticket_unavailable' })
      expect(await EventOrder.countDocuments()).toBe(0)
      expect(await EventOrderLog.countDocuments()).toBe(0)
    } finally {
      spy.mockRestore()
    }
  })

  it('annule lignes et revision du billet si la journalisation echoue', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id, { preorders: [{ name: 'Coca', price: 500, qty: 1 }] })
    const before = await Ticket.findById(ticket.id).lean()
    const spy = vi.spyOn(EventOrderLog, 'findOneAndUpdate').mockImplementationOnce(() => { throw new Error('audit unavailable') })
    try {
      await expect(materializeTicketOrders({ id: owner.id }, { eventId: event.id, ticketId: ticket.ticketCode })).rejects.toThrow('audit unavailable')
      expect(await EventOrder.countDocuments()).toBe(0)
      expect(await EventOrderLog.countDocuments()).toBe(0)
      expect(await Ticket.findById(ticket.id).lean()).toEqual(before)
    } finally {
      spy.mockRestore()
    }
  })

  it('refuse un nouvel ajout pour client, tiers, organisateur et tous les agents', async () => {
    const owner = await seedUser()
    const holder = await seedUser()
    const stranger = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id)
    const callers = [owner, holder, stranger]
    for (const role of ['scan', 'serveur', 'manager'] as const) {
      const agent = await seedUser()
      await addStaff(event.id, agent.id, role)
      callers.push(agent)
    }
    for (const caller of callers) {
      expect(await addOrderItem({ id: caller.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 }))
        .toEqual({ ok: false, status: 410, error: 'standalone_orders_disabled_v1' })
    }
    expect(await EventOrder.countDocuments()).toBe(0)
    expect(await EventOrderLog.countDocuments()).toBe(0)
  })

  it('ne fusionne plus les ajouts repetes dans une ligne historique', async () => {
    const owner = await seedUser()
    const holder = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id)
    await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 2 })
    const before = await EventOrder.findOne({ eventId: event.id }).lean()
    const logBefore = await EventOrderLog.findOne({ eventId: event.id }).lean()
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(await addOrderItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 }))
        .toEqual({ ok: false, status: 410, error: 'standalone_orders_disabled_v1' })
    }
    expect(await EventOrder.findOne({ eventId: event.id }).lean()).toEqual(before)
    expect(await EventOrderLog.findOne({ eventId: event.id }).lean()).toEqual(logBefore)
  })

  it('le titulaire consulte et reduit une ancienne ligne sans pouvoir augmenter sa quantite', async () => {
    const owner = await seedUser()
    const holder = await seedUser()
    const event = await seedEvent(owner.id)
    const ticket = await seedTicket(event.id, holder.id)
    const { item } = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 5 })
    expect(await updateOrderItemQuantity({ id: holder.id }, { eventId: event.id, itemId: item.id, quantity: 6 }))
      .toEqual({ ok: false, status: 410, error: 'standalone_orders_disabled_v1' })
    const updated = await updateOrderItemQuantity({ id: holder.id }, { eventId: event.id, itemId: item.id, quantity: 2 })
    expect(updated.ok).toBe(true)
    const listed = await listOrdersForTicket({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(listed.ok).toBe(true)
    if (listed.ok) expect(listed.items).toEqual([expect.objectContaining({ id: item.id, quantity: 2 })])
  })

  it('ferme H15 : un rang 0 ne peut lire que les commandes de SON PROPRE billet', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const stranger = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)
    await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })

    const result = await listOrdersForTicket({ id: stranger.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(403)
    expect(result.error).toBe('forbidden')
  })

  it('staff (serveur, rang 2) sert/encaisse une ligne historique sur le billet du client ; le client (rang 0) est refusé sur serve/pay/cancel', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const added = await seedHistoricalItem(
      { id: serveurUser.id },
      { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Champagne', quantity: 1 }
    )
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.item.addedBy).toBe(serveurUser.id)

    // Le client (rang 0) ne peut ni servir, ni encaisser, ni annuler — même
    // sur une ligne de SA propre addition.
    const serveDenied = await serveOrderItem({ id: holder.id }, { eventId: event.id, itemId: added.item.id })
    expect(serveDenied.ok).toBe(false)
    if (!serveDenied.ok) {
      expect(serveDenied.status).toBe(403)
      expect(serveDenied.error).toBe('serve_staff_only')
    }

    const payDenied = await payTicketOrders({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(payDenied.ok).toBe(false)
    if (!payDenied.ok) {
      expect(payDenied.status).toBe(403)
      expect(payDenied.error).toBe('pay_staff_only')
    }

    const cancelDenied = await cancelOrderItem({ id: holder.id }, { eventId: event.id, itemId: added.item.id, reason: 'test' })
    expect(cancelDenied.ok).toBe(false)
    if (!cancelDenied.ok) {
      expect(cancelDenied.status).toBe(403)
      expect(cancelDenied.error).toBe('cancel_manager_only')
    }

    // Le serveur (rang 2), lui, peut servir puis encaisser.
    const served = await serveOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id })
    expect(served.ok).toBe(true)
    if (!served.ok || served.alreadyServed) return
    expect(served.item.servedBy).toBe(serveurUser.id)
    expect(served.item.status).toBe('served')

    const paid = await payTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(paid.ok).toBe(true)
    if (!paid.ok) return
    expect(paid.total).toBe(15000)
    expect(paid.itemCount).toBe(1)
  })

  it('rang ≥ 1 (scan, rang 1) PEUT servir une ligne — la garde serve_staff_only est bien rang ≥ 1, pas rang ≥ 2', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const scanUser = await seedUser()
    await addStaff(event.id, scanUser.id, 'scan')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)
    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(added.ok).toBe(true)
    if (!added.ok) return

    const served = await serveOrderItem({ id: scanUser.id }, { eventId: event.id, itemId: added.item.id })
    expect(served.ok).toBe(true)
    if (!served.ok || served.alreadyServed) return
    expect(served.item.servedBy).toBe(scanUser.id)

    // Mais le scan (rang 1) ne peut pas encaisser (rang ≥ 2 requis).
    const payDenied = await payTicketOrders({ id: scanUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(payDenied.ok).toBe(false)
    if (!payDenied.ok) {
      expect(payDenied.status).toBe(403)
      expect(payDenied.error).toBe('pay_staff_only')
    }
  })

  it("seul le rang 3 (manager ou propriétaire) peut annuler ; un serveur (rang 2) est refusé (cancel_manager_only)", async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const managerUser = await seedUser()
    await addStaff(event.id, managerUser.id, 'manager')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const item1 = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    const item2 = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(item1.ok).toBe(true)
    expect(item2.ok).toBe(true)
    if (!item1.ok || !item2.ok) return

    const serveurDenied = await cancelOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: item1.item.id, reason: 'erreur de saisie' })
    expect(serveurDenied.ok).toBe(false)
    if (!serveurDenied.ok) {
      expect(serveurDenied.status).toBe(403)
      expect(serveurDenied.error).toBe('cancel_manager_only')
    }

    const managerCancels = await cancelOrderItem({ id: managerUser.id }, { eventId: event.id, itemId: item1.item.id, reason: 'erreur de saisie' })
    expect(managerCancels.ok).toBe(true)
    if (!managerCancels.ok || managerCancels.noop) return
    expect(managerCancels.item.status).toBe('cancelled')
    expect(managerCancels.item.cancelledBy).toBe(managerUser.id)
    expect(managerCancels.item.cancellationReason).toBe('erreur de saisie')

    const ownerCancels = await cancelOrderItem({ id: owner.id }, { eventId: event.id, itemId: item2.item.id, reason: 'doublon' })
    expect(ownerCancels.ok).toBe(true)
    if (!ownerCancels.ok || ownerCancels.noop) return
    expect(ownerCancels.item.status).toBe('cancelled')
  })

  it("l'annulation exige un motif non vide (reason_required)", async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)
    const item = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(item.ok).toBe(true)
    if (!item.ok) return

    const result = await cancelOrderItem({ id: owner.id }, { eventId: event.id, itemId: item.item.id, reason: '' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(400)
    expect(result.error).toBe('reason_required')
  })

  it('asymétrie rang0/staff : rang 0 sur sa ligne déjà servie → erreur dure (locked) ; staff sur une ligne déjà servie → no-op silencieux', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    await serveOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id })

    // Rang 0 sur SA PROPRE ligne, déjà servie → erreur dure.
    const updateDenied = await updateOrderItemQuantity({ id: holder.id }, { eventId: event.id, itemId: added.item.id, quantity: 3 })
    expect(updateDenied.ok).toBe(false)
    if (!updateDenied.ok) {
      expect(updateDenied.status).toBe(409)
      expect(updateDenied.error).toBe('locked')
    }
    const removeDenied = await removeOrderItem({ id: holder.id }, { eventId: event.id, itemId: added.item.id })
    expect(removeDenied.ok).toBe(false)
    if (!removeDenied.ok) {
      expect(removeDenied.status).toBe(409)
      expect(removeDenied.error).toBe('locked')
    }

    // Staff sur une ligne déjà servie (n'importe laquelle) → succès silencieux.
    const staffUpdateNoop = await updateOrderItemQuantity({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id, quantity: 9 })
    expect(staffUpdateNoop.ok).toBe(true)
    if (staffUpdateNoop.ok) expect(staffUpdateNoop.noop).toBe(true)

    const staffRemoveNoop = await removeOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id })
    expect(staffRemoveNoop.ok).toBe(true)
    if (staffRemoveNoop.ok) expect(staffRemoveNoop.noop).toBe(true)

    // La ligne n'a bien pas été supprimée ni sa quantité modifiée par les no-ops.
    const order = await EventOrder.findOne({ eventId: event.id }).lean()
    const stillThere = order?.items.find((i) => i.id === added.item.id)
    expect(stillThere).toBeTruthy()
    expect(stillThere?.quantity).toBe(1)
  })

  it('payTicketOrders exclut les précommandes déjà payées et les lignes annulées du total, encaisse le reste en un appel, puis refuse un second encaissement (nothing_to_pay)', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id, {
      place: 'VIP',
      preorders: [{ name: 'Champagne', price: 15000, qty: 1 }],
    })

    // Ligne à encaisser (500 x 2 = 1000).
    const payable = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 2 })
    expect(payable.ok).toBe(true)
    if (!payable.ok) return

    // Ligne annulée : ne doit JAMAIS être facturée.
    const toCancel = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Champagne', quantity: 1 })
    expect(toCancel.ok).toBe(true)
    if (!toCancel.ok) return
    await cancelOrderItem({ id: owner.id }, { eventId: event.id, itemId: toCancel.item.id, reason: 'annulé par erreur' })

    // Précommande déjà payée au checkout (Champagne, kind 'preorder') :
    // matérialisée mais jamais re-facturée ici. La place VIP inclut aussi 2x
    // Coca gratuits (kind 'included', prix 0) — ceux-ci NE SONT PAS des
    // précommandes, donc ils sont bien balayés par payTicketOrders (seul
    // kind:'preorder' est exclu par la spec), juste sans impact sur le total
    // puisque leur prix est 0.
    const materialized = await materializeTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(materialized.ok).toBe(true)
    if (!materialized.ok) return
    expect(materialized.inserted).toBe(2) // 1 précommande (Champagne) + 1 inclus (Coca)

    const firstPay = await payTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(firstPay.ok).toBe(true)
    if (!firstPay.ok) return
    expect(firstPay.total).toBe(1000) // 500 x 2 (Coca payant) ; le Coca inclus (prix 0) n'ajoute rien
    expect(firstPay.itemCount).toBe(2) // la ligne payante + la ligne incluse (prix 0), toutes deux marquées payées

    const preorderStillUnpaid = await EventOrder.findOne({ eventId: event.id }).lean()
    const preorderLine = preorderStillUnpaid?.items.find((i) => i.kind === 'preorder')
    expect(preorderLine?.paidAt).toBeFalsy() // la précommande (déjà payée au checkout) n'est jamais re-facturée ici

    const secondPay = await payTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(secondPay.ok).toBe(false)
    if (secondPay.ok) return
    expect(secondPay.status).toBe(400)
    expect(secondPay.error).toBe('nothing_to_pay')
  })

  it('materializeTicketOrders est idempotent : un second appel n’insère rien de plus et ne réinitialise pas une ligne déjà servie', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id, {
      place: 'VIP', // event.places VIP.included = [{name:'Coca', qty:2}]
      preorders: [{ name: 'Champagne', price: 15000, qty: 1 }],
    })

    const first = await materializeTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.inserted).toBe(2) // 1 précommande (Champagne) + 1 inclus (Coca)

    const orderAfterFirst = await EventOrder.findOne({ eventId: event.id }).lean()
    expect(orderAfterFirst?.items).toHaveLength(2)
    const preorderItem = orderAfterFirst?.items.find((i) => i.kind === 'preorder')
    expect(preorderItem).toBeTruthy()

    // Un membre du staff sert manuellement la ligne précommande.
    const served = await serveOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: preorderItem!.id })
    expect(served.ok).toBe(true)

    const second = await materializeTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.inserted).toBe(0) // rien de nouveau, dédoublonné par id déterministe

    const orderAfterSecond = await EventOrder.findOne({ eventId: event.id }).lean()
    expect(orderAfterSecond?.items).toHaveLength(2) // pas de doublon
    const preorderItemAfter = orderAfterSecond?.items.find((i) => i.kind === 'preorder')
    expect(preorderItemAfter?.status).toBe('served') // pas réinitialisée par le second appel
    expect(preorderItemAfter?.servedBy).toBe(serveurUser.id)
  })

  it('listOrdersForEvent et getOrderLog ferment H14/H15 : rang 0 refusé, staff approprié autorisé', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const scanUser = await seedUser()
    await addStaff(event.id, scanUser.id, 'scan')
    const managerUser = await seedUser()
    await addStaff(event.id, managerUser.id, 'manager')
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)
    await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })

    // listOrdersForEvent : rang 0 refusé, rang ≥ 1 (même simple scan) autorisé.
    const eventViewDenied = await listOrdersForEvent({ id: holder.id }, { eventId: event.id })
    expect(eventViewDenied.ok).toBe(false)
    if (!eventViewDenied.ok) {
      expect(eventViewDenied.status).toBe(403)
      expect(eventViewDenied.error).toBe('forbidden')
    }
    const eventViewAllowed = await listOrdersForEvent({ id: scanUser.id }, { eventId: event.id })
    expect(eventViewAllowed.ok).toBe(true)
    if (eventViewAllowed.ok) expect(eventViewAllowed.items).toHaveLength(1)

    // getOrderLog : réservé au rang 3 EXACTEMENT (serveur rang 2 refusé aussi).
    const logDeniedClient = await getOrderLog({ id: holder.id }, { eventId: event.id })
    expect(logDeniedClient.ok).toBe(false)
    if (!logDeniedClient.ok) expect(logDeniedClient.error).toBe('forbidden')

    const logDeniedServeur = await getOrderLog({ id: serveurUser.id }, { eventId: event.id })
    expect(logDeniedServeur.ok).toBe(false)
    if (!logDeniedServeur.ok) expect(logDeniedServeur.error).toBe('forbidden')

    const logAllowedManager = await getOrderLog({ id: managerUser.id }, { eventId: event.id })
    expect(logAllowedManager.ok).toBe(true)
    if (logAllowedManager.ok) expect(logAllowedManager.entries.length).toBeGreaterThan(0)

    const logAllowedOwner = await getOrderLog({ id: owner.id }, { eventId: event.id })
    expect(logAllowedOwner.ok).toBe(true)
  })

  it('chaque action mutante produit une entrée de journal EventOrderLog de la forme attendue', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const managerUser = await seedUser()
    await addStaff(event.id, managerUser.id, 'manager')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 4 })
    expect(added.ok).toBe(true)
    if (!added.ok) return

    await updateOrderItemQuantity({ id: holder.id }, { eventId: event.id, itemId: added.item.id, quantity: 3 })
    await serveOrderItem({ id: managerUser.id }, { eventId: event.id, itemId: added.item.id })
    await payTicketOrders({ id: managerUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })

    const added2 = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Champagne', quantity: 1 })
    expect(added2.ok).toBe(true)
    if (!added2.ok) return
    await cancelOrderItem({ id: managerUser.id }, { eventId: event.id, itemId: added2.item.id, reason: 'test log' })

    const added3 = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(added3.ok).toBe(true)
    if (!added3.ok) return
    await removeOrderItem({ id: holder.id }, { eventId: event.id, itemId: added3.item.id })

    const log = await EventOrderLog.findOne({ eventId: event.id }).lean()
    expect(log).toBeTruthy()
    const actions = (log?.entries ?? []).map((e) => e.action)
    expect(actions).toEqual(expect.arrayContaining(['edit', 'serve', 'pay', 'cancel', 'remove']))
    expect(log?.entries.filter((entry) => entry.action === 'add').every((entry) => entry.note === 'historical_fixture')).toBe(true)

    for (const entry of log?.entries ?? []) {
      expect(entry.id).toBeTruthy()
      expect(entry.ts).toBeTruthy()
      expect(entry.actorId).toBeTruthy()
      expect(entry.action).toBeTruthy()
    }

    const cancelEntry = (log?.entries ?? []).find((e) => e.action === 'cancel')
    expect(cancelEntry?.note).toBe('test log')
    expect(cancelEntry?.actorId).toBe(managerUser.id)

    const payEntry = (log?.entries ?? []).find((e) => e.action === 'pay')
    expect(payEntry?.amountMinor).toBe(1500) // 500 * 3 (quantité modifiée à 3 avant l'encaissement)
  })

  it('serveOrderItem refuse (item_cancelled) de "servir" une ligne déjà annulée par un manager — ne la rend pas de nouveau facturable', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Champagne', quantity: 1 })
    expect(added.ok).toBe(true)
    if (!added.ok) return

    // Le manager annule la ligne AVANT tout service.
    const cancelled = await cancelOrderItem({ id: owner.id }, { eventId: event.id, itemId: added.item.id, reason: 'client parti' })
    expect(cancelled.ok).toBe(true)
    if (!cancelled.ok || cancelled.noop) return
    expect(cancelled.item.status).toBe('cancelled')

    // N'importe quel staff (ici rang 2) tentant de la servir doit être
    // refusé — pas silencieusement "already served", une vraie erreur.
    const serveAttempt = await serveOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id })
    expect(serveAttempt.ok).toBe(false)
    if (!serveAttempt.ok) {
      expect(serveAttempt.status).toBe(409)
      expect(serveAttempt.error).toBe('item_cancelled')
    }

    // La ligne reste annulée, jamais servie, et payTicketOrders n'a donc rien
    // à facturer dessus.
    const order = await EventOrder.findOne({ eventId: event.id }).lean()
    const stillCancelled = order?.items.find((i) => i.id === added.item.id)
    expect(stillCancelled?.status).toBe('cancelled')
    expect(stillCancelled?.servedAt).toBeFalsy()

    const payAttempt = await payTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(payAttempt.ok).toBe(false)
    if (!payAttempt.ok) expect(payAttempt.error).toBe('nothing_to_pay')
  })

  it('updateOrderItemQuantity/removeOrderItem traitent une ligne annulée comme verrouillée (locked) — rang 0 erreur dure, staff no-op silencieux', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    // Ligne fraîchement ajoutée (jamais servie, jamais payée), puis annulée
    // par le manager (owner) avant tout service.
    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const cancelled = await cancelOrderItem({ id: owner.id }, { eventId: event.id, itemId: added.item.id, reason: 'erreur de saisie' })
    expect(cancelled.ok).toBe(true)
    if (!cancelled.ok || cancelled.noop) return

    // Rang 0 (l'ajouteur d'origine) ne peut plus éditer la quantité de SA
    // PROPRE ligne une fois annulée — erreur dure 'locked', pas un succès.
    const updateDenied = await updateOrderItemQuantity({ id: holder.id }, { eventId: event.id, itemId: added.item.id, quantity: 9 })
    expect(updateDenied.ok).toBe(false)
    if (!updateDenied.ok) {
      expect(updateDenied.status).toBe(409)
      expect(updateDenied.error).toBe('locked')
    }
    // Rang 0 ne peut pas non plus la supprimer, ce qui effacerait
    // cancelledAt/cancelledBy/cancellationReason.
    const removeDeniedRank0 = await removeOrderItem({ id: holder.id }, { eventId: event.id, itemId: added.item.id })
    expect(removeDeniedRank0.ok).toBe(false)
    if (!removeDeniedRank0.ok) {
      expect(removeDeniedRank0.status).toBe(409)
      expect(removeDeniedRank0.error).toBe('locked')
    }

    // Staff (rang ≥ 1, ici serveur) : no-op silencieux, ni l'un ni l'autre.
    const staffUpdateNoop = await updateOrderItemQuantity({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id, quantity: 9 })
    expect(staffUpdateNoop.ok).toBe(true)
    if (staffUpdateNoop.ok) expect(staffUpdateNoop.noop).toBe(true)
    const staffRemoveNoop = await removeOrderItem({ id: serveurUser.id }, { eventId: event.id, itemId: added.item.id })
    expect(staffRemoveNoop.ok).toBe(true)
    if (staffRemoveNoop.ok) expect(staffRemoveNoop.noop).toBe(true)

    // La ligne annulée est toujours là, quantité et motif d'annulation
    // intacts.
    const order = await EventOrder.findOne({ eventId: event.id }).lean()
    const stillThere = order?.items.find((i) => i.id === added.item.id)
    expect(stillThere).toBeTruthy()
    expect(stillThere?.quantity).toBe(1)
    expect(stillThere?.status).toBe('cancelled')
    expect(stillThere?.cancellationReason).toBe('erreur de saisie')
  })

  it("listOrdersForTicket (rang 0) refuse un billet réel du même appelant mais pour un AUTRE événement (scoping eventId/ticketId)", async () => {
    const owner = await seedUser()
    const eventA = await seedEvent(owner.id)
    const eventB = await seedEvent(owner.id)
    const holder = await seedUser()
    // Le billet appartient bien au caller, mais pour eventA — pas eventB.
    const ticketA = await seedTicket(eventA.id, holder.id)
    await seedHistoricalItem({ id: holder.id }, { eventId: eventA.id, ticketId: ticketA.ticketCode, menuItemId: 'Coca', quantity: 1 })

    const crossEventRead = await listOrdersForTicket({ id: holder.id }, { eventId: eventB.id, ticketId: ticketA.ticketCode })
    expect(crossEventRead.ok).toBe(false)
    if (!crossEventRead.ok) {
      expect(crossEventRead.status).toBe(404)
      expect(crossEventRead.error).toBe('ticket_not_found')
    }

    // Sur le bon événement, la lecture fonctionne toujours normalement.
    const sameEventRead = await listOrdersForTicket({ id: holder.id }, { eventId: eventA.id, ticketId: ticketA.ticketCode })
    expect(sameEventRead.ok).toBe(true)
    if (sameEventRead.ok) expect(sameEventRead.items).toHaveLength(1)
  })

  it('materializeTicketOrders fusionne deux précommandes de même nom (dupliquées au checkout) en UNE seule ligne de quantité cumulée', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const serveurUser = await seedUser()
    await addStaff(event.id, serveurUser.id, 'serveur')
    const holder = await seedUser()
    // Deux entrées Champagne distinctes plutôt qu'une seule qty:2 — reproduit
    // ce qu'un checkout non-dédupliqué peut produire dans ticket.preorders.
    const ticket = await seedTicket(event.id, holder.id, {
      preorders: [
        { name: 'Champagne', price: 15000, qty: 1 },
        { name: 'Champagne', price: 15000, qty: 1 },
      ],
    })

    const materialized = await materializeTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(materialized.ok).toBe(true)
    if (!materialized.ok) return
    expect(materialized.inserted).toBe(1) // fusionnées, pas deux lignes au même id

    const order = await EventOrder.findOne({ eventId: event.id }).lean()
    const champagneLines = order?.items.filter((i) => i.name === 'Champagne') ?? []
    expect(champagneLines).toHaveLength(1)
    expect(champagneLines[0].quantity).toBe(2) // quantités cumulées

    // Un second appel reste idempotent (pas de nouvelle insertion).
    const second = await materializeTicketOrders({ id: serveurUser.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(second.ok).toBe(true)
    if (second.ok) expect(second.inserted).toBe(0)
  })

  it('removeOrderItem (succès réel) fait disparaître la ligne de listOrdersForTicket ET listOrdersForEvent', async () => {
    const owner = await seedUser()
    const event = await seedEvent(owner.id)
    const holder = await seedUser()
    const ticket = await seedTicket(event.id, holder.id)

    const added = await seedHistoricalItem({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode, menuItemId: 'Coca', quantity: 1 })
    expect(added.ok).toBe(true)
    if (!added.ok) return

    // Confirme la présence AVANT suppression dans les deux vues de lecture.
    const beforeTicket = await listOrdersForTicket({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(beforeTicket.ok).toBe(true)
    if (beforeTicket.ok) expect(beforeTicket.items.map((i) => i.id)).toContain(added.item.id)
    const beforeEvent = await listOrdersForEvent({ id: owner.id }, { eventId: event.id })
    expect(beforeEvent.ok).toBe(true)
    if (beforeEvent.ok) expect(beforeEvent.items.map((i) => i.id)).toContain(added.item.id)

    // Suppression réelle (non-servie, non-payée) par le rang 0 propriétaire
    // de la ligne.
    const removed = await removeOrderItem({ id: holder.id }, { eventId: event.id, itemId: added.item.id })
    expect(removed.ok).toBe(true)
    if (removed.ok) expect(removed.noop).toBeFalsy()

    const afterTicket = await listOrdersForTicket({ id: holder.id }, { eventId: event.id, ticketId: ticket.ticketCode })
    expect(afterTicket.ok).toBe(true)
    if (afterTicket.ok) expect(afterTicket.items.map((i) => i.id)).not.toContain(added.item.id)
    const afterEvent = await listOrdersForEvent({ id: owner.id }, { eventId: event.id })
    expect(afterEvent.ok).toBe(true)
    if (afterEvent.ok) expect(afterEvent.items.map((i) => i.id)).not.toContain(added.item.id)
  })
})
