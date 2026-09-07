import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import Event from '@/lib/models/Event'
import { deliverMessageForConversation } from '../messaging/messagingDeliveryService'
import { createPoll, createEventPoll } from '../messaging/polls'
import { forwardMessageToConversations } from '../messaging/messagingForwardService'
import { seedCatalogEvent } from './integrationTestHelpers'

const notifications = vi.fn().mockResolvedValue(undefined)
const push = vi.fn().mockResolvedValue(undefined)
beforeAll(async () => {
  await getDb()
  await Promise.all([Conversation.init(), Message.init()])
})
beforeEach(async () => {
  vi.restoreAllMocks()
  notifications.mockClear()
  push.mockClear()
  await Conversation.deleteMany({})
  await Message.deleteMany({})
  await Event.deleteMany({})
})

describe.each(['poll', 'event_poll', 'forward'] as const)('%s utilise la transaction commune', kind => {
  async function prepare() {
    const caller = { id: new mongoose.Types.ObjectId().toString() }
    const conversation = await Conversation.create({ type: 'group', participantIds: [caller.id] })
    const event = await seedCatalogEvent({ currency: 'XOF', region: 'benin', city: 'Cotonou', country: 'Bénin' })
    const send = () => kind === 'poll'
      ? createPoll(caller, { conversationId: conversation.id, question: 'On sort ?', options: ['Oui', 'Non'] })
      : kind === 'event_poll'
        ? createEventPoll(caller, { conversationId: conversation.id, eventId: event.id })
        : forwardMessageToConversations(caller, {
          source: { type: 'text', content: 'Bonjour', poll: null, senderName: 'Source' },
          sourceConversation: { type: 'group', name: 'Origine', participantIds: [caller.id] },
          targetIds: [conversation.id],
        }, {
          loadParticipantConversation: async () => ({ ok: true, conversation }),
          assertCanSendInConversation: async () => ({ ok: true }),
          resolveDisplayName: async () => 'Test',
        })
    return { conversation, send }
  }

  it('valide message, apercu et reveil ensemble', async () => {
    const { conversation, send } = await prepare()
    expect((await send()).ok).toBe(true)
    const stored = await Conversation.findById(conversation.id)
    const message = await Message.findOne({ conversationId: conversation.id })
    expect(message?.type).toBe(kind === 'forward' ? 'text' : kind)
    expect(stored?.messageDigestRevision).toBe(1)
    expect(stored?.messageDigestNextCheckAt).toBeInstanceOf(Date)
    expect(stored?.lastMessage).not.toBe('')
  })

  it('annule le message si le reveil echoue', async () => {
    const { conversation, send } = await prepare()
    vi.spyOn(Conversation, 'updateOne').mockImplementationOnce(() => { throw new Error('wake_failure') })
    await expect(send()).rejects.toThrow('wake_failure')
    expect(await Message.countDocuments({})).toBe(0)
    const stored = await Conversation.findById(conversation.id)
    expect(stored?.messageDigestRevision).toBe(0)
    expect(stored?.lastMessage).toBe('')
  })

  it('annule les deux ecritures meme si la panne arrive apres la mise a jour', async () => {
    const { conversation, send } = await prepare()
    const update = Conversation.updateOne.bind(Conversation)
    vi.spyOn(Conversation, 'updateOne').mockImplementationOnce(((...args: Parameters<typeof update>) => {
      return (async () => { await update(...args); throw new Error('after_wake_failure') })()
    }) as unknown as typeof Conversation.updateOne)
    await expect(send()).rejects.toThrow('after_wake_failure')
    expect(await Message.countDocuments({})).toBe(0)
    const stored = await Conversation.findById(conversation.id)
    expect(stored?.messageDigestRevision).toBe(0)
    expect(stored?.messageDigestNextCheckAt).toBeNull()
    expect(stored?.lastMessage).toBe('')
  })
})
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed() {
  return Conversation.create({ type: 'group', participantIds: ['sender'] })
}
function deliver(conversation: Awaited<ReturnType<typeof seed>>, content = 'Bonjour') {
  return deliverMessageForConversation({ id: 'sender' }, conversation,
    { type: 'text', content, senderName: 'Test', replyToMessageId: null },
    { site: 'https://example.test' },
    { upsertMessageNotification: notifications, sendPushToUser: push, toMessageView: message => message },
  )
}

describe('message et reveil email atomiques', () => {
  it('enregistre ensemble le message, son apercu et le reveil durable', async () => {
    const conversation = await seed()
    await deliver(conversation)
    const stored = await Conversation.findById(conversation.id)
    expect(await Message.countDocuments({ conversationId: conversation.id })).toBe(1)
    expect(stored?.lastMessage).toBe('Bonjour')
    expect(stored?.messageDigestNextCheckAt).toBeInstanceOf(Date)
    expect(stored?.messageDigestRevision).toBe(1)
  })

  it('annule le message si le reveil ne peut pas etre enregistre', async () => {
    const conversation = await seed()
    vi.spyOn(Conversation, 'updateOne').mockImplementationOnce(() => { throw new Error('database_failure') })
    await expect(deliver(conversation)).rejects.toThrow('database_failure')
    expect(await Message.countDocuments({})).toBe(0)
    expect((await Conversation.findById(conversation.id))?.messageDigestNextCheckAt).toBeNull()
    expect(notifications).not.toHaveBeenCalled()
  })

  it('annule aussi le reveil si une panne survient apres son ecriture transactionnelle', async () => {
    const conversation = await seed()
    const update = Conversation.updateOne.bind(Conversation)
    vi.spyOn(Conversation, 'updateOne').mockImplementationOnce(((...args: Parameters<typeof update>) => {
      return (async () => { await update(...args); throw new Error('after_write_failure') })()
    }) as unknown as typeof Conversation.updateOne)
    await expect(deliver(conversation)).rejects.toThrow('after_write_failure')
    expect(await Message.countDocuments({})).toBe(0)
    const stored = await Conversation.findById(conversation.id)
    expect(stored?.lastMessage).toBe('')
    expect(stored?.messageDigestNextCheckAt).toBeNull()
    expect(stored?.messageDigestRevision).toBe(0)
  })

  it('refuse un ancien participant retire depuis le controle initial', async () => {
    const conversation = await seed()
    await Conversation.updateOne({ _id: conversation.id }, { $pull: { participantIds: 'sender' } })
    await expect(deliver(conversation)).rejects.toThrow('conversation_unavailable')
    expect(await Message.countDocuments({})).toBe(0)
    expect((await Conversation.findById(conversation.id))?.messageDigestRevision).toBe(0)
  })

  it('ne laisse pas de message orphelin si la conversation a disparu', async () => {
    const conversation = await seed()
    await Conversation.deleteOne({ _id: conversation.id })
    await expect(deliver(conversation)).rejects.toThrow('conversation_unavailable')
    expect(await Message.countDocuments({})).toBe(0)
  })

  it('conserve chaque message et revision lors de dix envois concurrents', async () => {
    const conversation = await seed()
    await Promise.all(Array.from({ length: 10 }, (_, index) => deliver(conversation, `Message ${index}`)))
    const stored = await Conversation.findById(conversation.id)
    const messages = await Message.find({ conversationId: conversation.id }).lean()
    expect(messages).toHaveLength(10)
    expect(new Set(messages.map(message => message.content)).size).toBe(10)
    expect(stored?.messageDigestRevision).toBe(10)
    expect(stored?.messageDigestNextCheckAt).toBeInstanceOf(Date)
    expect(messages.some(message => message.content === stored?.lastMessage)).toBe(true)
  })
})
