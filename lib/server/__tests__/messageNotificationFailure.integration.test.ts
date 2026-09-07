import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import { deliverMessageForConversation, type DeliverMessageOptions } from '../messaging/messagingDeliveryService'

beforeAll(async () => { await getDb() })
beforeEach(async () => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  await Conversation.deleteMany({})
  await Message.deleteMany({})
  await User.deleteMany({})
})
afterAll(async () => { vi.restoreAllMocks(); await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

async function seed() {
  const sender = await User.create({ email: 'sender@test.invalid', passwordHash: 'test', roles: ['client'], activeRole: 'client' })
  const recipients = await User.create([1, 2].map(id => ({ email: `recipient${id}@test.invalid`, passwordHash: 'test', roles: ['client' as const], activeRole: 'client' as const })))
  const conversation = await Conversation.create({ type: 'group', participantIds: [sender.id, ...recipients.map(user => user.id)] })
  const notification = vi.fn().mockResolvedValue(undefined)
  const push = vi.fn().mockResolvedValue(undefined)
  const deliver = (options: Partial<DeliverMessageOptions> = {}) => deliverMessageForConversation(
    { id: sender.id }, conversation,
    { type: 'text', content: 'private-message-body', senderName: 'Private Name', replyToMessageId: null },
    { site: 'https://example.test', ...options },
    { upsertMessageNotification: notification, sendPushToUser: push, toMessageView: message => ({ id: String(message._id) }) },
  )
  const persisted = async () => {
    expect(await Message.countDocuments({ conversationId: conversation.id })).toBe(1)
    expect((await Conversation.findById(conversation.id))?.messageDigestNextCheckAt).toBeInstanceOf(Date)
    const log = JSON.stringify(vi.mocked(console.warn).mock.calls)
    expect(log).not.toMatch(/private-message-body|Private Name|test.invalid|secret-provider-error/)
  }
  return { sender, recipients, conversation, notification, push, deliver, persisted }
}

describe('echec de notification apres commit ne devient pas echec du message', () => {
  it('le push differe utilise le texte modifie et non le contenu initial', async () => {
    const h = await seed()
    let pending: (() => Promise<void>) | undefined
    const result = await h.deliver({ deferSideEffects: work => { pending = work } })
    await Message.updateOne({ _id: result.message.id }, { $set: { content: 'Texte corrige', editedAt: new Date() } })
    await pending!()
    expect(h.push).toHaveBeenCalledTimes(2)
    for (const [, payload] of h.push.mock.calls) {
      expect(payload.body).toBe('Texte corrige')
      expect(JSON.stringify(payload)).not.toContain('private-message-body')
    }
  })

  it('une notification interne ulterieure au commit utilise aussi le texte relu', async () => {
    const h = await seed()
    const find = Message.findOne.bind(Message)
    vi.spyOn(Message, 'findOne').mockImplementationOnce(((...args: Parameters<typeof find>) => ({
      select: () => ({ lean: async () => {
        await Message.updateOne({ conversationId: h.conversation.id }, { $set: { content: 'Correction avant notification' } })
        return find(...args).lean()
      } }),
    })) as unknown as typeof Message.findOne)
    await h.deliver()
    expect(h.notification).toHaveBeenCalledTimes(2)
    for (const [, , preview] of h.notification.mock.calls) expect(preview).toBe('Correction avant notification')
  })

  it('ne diffuse pas un message requalifie comme systeme', async () => {
    const h = await seed()
    let pending: (() => Promise<void>) | undefined
    const result = await h.deliver({ deferSideEffects: work => { pending = work } })
    await Message.updateOne({ _id: result.message.id }, { $set: { type: 'system' } })
    await pending!()
    expect(h.push).not.toHaveBeenCalled()
  })

  it.each(['deleted_all', 'missing', 'deleted_recipient', 'read_message', 'read_conversation'] as const)(
    'annule le push devenu inutile : %s', async kind => {
      const h = await seed()
      let pending: (() => Promise<void>) | undefined
      const result = await h.deliver({ deferSideEffects: work => { pending = work } })
      const id = result.message.id
      const recipientId = h.recipients[0].id
      if (kind === 'deleted_all') await Message.updateOne({ _id: id }, { $set: { deletedForAll: true } })
      if (kind === 'missing') await Message.deleteOne({ _id: id })
      if (kind === 'deleted_recipient') await Message.updateOne({ _id: id }, { $addToSet: { deletedForUserIds: recipientId } })
      if (kind === 'read_message') await Message.updateOne({ _id: id }, { $set: { [`readBy.${recipientId}`]: new Date() } })
      if (kind === 'read_conversation') await Conversation.updateOne({ _id: h.conversation.id }, { $set: { [`lastReadAt.${recipientId}`]: new Date() } })
      await pending!()
      expect(h.push.mock.calls.map(call => call[0])).toEqual(
        kind === 'deleted_all' || kind === 'missing' ? [] : [h.recipients[1].id],
      )
    },
  )

  it('une ancienne lecture ne masque pas un nouveau message', async () => {
    const h = await seed()
    await Conversation.updateOne({ _id: h.conversation.id }, { $set: { [`lastReadAt.${h.recipients[0].id}`]: new Date(0) } })
    await h.deliver()
    expect(h.push).toHaveBeenCalledTimes(2)
  })

  it('supporte les anciens documents sans champs de lecture', async () => {
    const h = await seed()
    let pending: (() => Promise<void>) | undefined
    const result = await h.deliver({ deferSideEffects: work => { pending = work } })
    await Message.collection.updateOne({ _id: new mongoose.Types.ObjectId(result.message.id) }, { $unset: { readBy: '', deletedForUserIds: '' } })
    await Conversation.collection.updateOne({ _id: h.conversation._id }, { $unset: { lastReadAt: '' } })
    await pending!()
    expect(h.push).toHaveBeenCalledTimes(2)
  })

  it.each(['removed', 'muted', 'hidden', 'blocked_by_sender', 'blocked_by_recipient', 'disabled'] as const)(
    'reverifie %s avant notifications internes et push differes', async kind => {
      const h = await seed()
      const recipientId = h.recipients[0].id
      const exclude = async () => {
        if (kind === 'removed') await Conversation.updateOne({ _id: h.conversation.id }, { $pull: { participantIds: recipientId } })
        if (kind === 'muted') await Conversation.updateOne({ _id: h.conversation.id }, { $addToSet: { mutedConversationByUserIds: recipientId } })
        if (kind === 'hidden') await Conversation.updateOne({ _id: h.conversation.id }, { $addToSet: { hiddenByUserIds: recipientId } })
        if (kind === 'blocked_by_sender') await User.updateOne({ _id: h.sender.id }, { $addToSet: { blockedUserIds: recipientId } })
        if (kind === 'blocked_by_recipient') await User.updateOne({ _id: recipientId }, { $addToSet: { blockedUserIds: h.sender.id } })
        if (kind === 'disabled') await User.updateOne({ _id: recipientId }, { $set: { disabled: true } })
      }
      await exclude()
      let pending: (() => Promise<void>) | undefined
      expect((await h.deliver({ deferSideEffects: work => { pending = work } })).ok).toBe(true)
      expect(h.notification.mock.calls.map(call => call[0])).toEqual([h.recipients[1].id])
      await User.updateOne({ _id: h.recipients[1].id }, { $set: { disabled: true } })
      await pending!()
      expect(h.push).not.toHaveBeenCalled()
      await h.persisted()
    },
  )

  it('ne notifie pas un nouveau membre absent des destinataires initiaux', async () => {
    const h = await seed()
    const newcomer = await User.create({ email: 'new@test.invalid', passwordHash: 'test' })
    await Conversation.updateOne({ _id: h.conversation.id }, { $addToSet: { participantIds: newcomer.id } })
    await h.deliver()
    expect(h.notification.mock.calls.map(call => call[0])).not.toContain(newcomer.id)
    expect(h.push.mock.calls.map(call => call[0])).not.toContain(newcomer.id)
  })

  it('supprime les push differes si l expediteur est retire entretemps', async () => {
    const h = await seed()
    let pending: (() => Promise<void>) | undefined
    await h.deliver({ deferSideEffects: work => { pending = work } })
    await Conversation.updateOne({ _id: h.conversation.id }, { $pull: { participantIds: h.sender.id } })
    await pending!()
    expect(h.push).not.toHaveBeenCalled()
  })

  it('continue les autres notifications et push apres un echec in-app', async () => {
    const h = await seed()
    h.notification.mockRejectedValueOnce(new Error('secret-provider-error'))
    expect((await h.deliver()).ok).toBe(true)
    expect(h.notification).toHaveBeenCalledTimes(2)
    expect(h.push).toHaveBeenCalledTimes(2)
    expect(console.warn).toHaveBeenCalledWith('[messaging] post_commit_notification_failed', { stage: 'in_app' })
    await h.persisted()
  })
  it('conserve le succes apres un echec push', async () => {
    const h = await seed()
    h.push.mockRejectedValueOnce(new Error('secret-provider-error'))
    expect((await h.deliver()).ok).toBe(true)
    expect(h.push).toHaveBeenCalledTimes(2)
    expect(console.warn).toHaveBeenCalledWith('[messaging] post_commit_notification_failed', { stage: 'push' })
    await h.persisted()
  })
  it('ne perd pas la confirmation si la relecture des destinataires echoue', async () => {
    const h = await seed()
    vi.spyOn(User, 'find').mockImplementation(() => { throw new Error('secret-provider-error') })
    expect((await h.deliver()).ok).toBe(true)
    expect(h.push).not.toHaveBeenCalled()
    await h.persisted()
  })
  it('supporte un ordonnanceur differe indisponible sans renvoyer le message', async () => {
    const h = await seed()
    expect((await h.deliver({ deferSideEffects: () => { throw new Error('secret-provider-error') } })).ok).toBe(true)
    expect(h.push).not.toHaveBeenCalled()
    await h.persisted()
  })
  it('protege aussi le callback execute apres la reponse', async () => {
    const h = await seed()
    let pending: (() => Promise<void>) | undefined
    expect((await h.deliver({ deferSideEffects: work => { pending = work } })).ok).toBe(true)
    h.push.mockRejectedValue(new Error('secret-provider-error'))
    await expect(pending!()).resolves.toBeUndefined()
    expect(h.push).toHaveBeenCalledTimes(2)
    await h.persisted()
  })
  it('ne masque jamais un echec de persistence avant commit', async () => {
    const h = await seed()
    vi.spyOn(Conversation, 'updateOne').mockImplementationOnce(() => { throw new Error('write_failure') })
    await expect(h.deliver()).rejects.toThrow('write_failure')
    expect(await Message.countDocuments({})).toBe(0)
    expect(h.notification).not.toHaveBeenCalled()
    expect(h.push).not.toHaveBeenCalled()
  })
})
