import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import User from '@/lib/models/User'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import MessageDigest from '@/lib/models/MessageDigest'
import { sendEmail } from '../email'
import { sendPendingMessageDigests } from '../messaging/messageDigests'

vi.mock('../email', () => ({ sendEmail: vi.fn() }))

beforeAll(async () => {
  await getDb()
  await Promise.all([User.init(), MessageDigest.init(), Conversation.init()])
})
beforeEach(async () => {
  vi.restoreAllMocks()
  vi.mocked(sendEmail).mockReset().mockResolvedValue({ ok: true })
  await Promise.all([User.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({}), MessageDigest.deleteMany({})])
})
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

async function seed(count = 1, ageMinutes = 31) {
  const now = Date.now()
  const sender = await User.create({ email: 'sender@test.com', passwordHash: 'test-only', roles: ['client'], activeRole: 'client' })
  const recipient = await User.create({ email: 'recipient@test.com', passwordHash: 'test-only', roles: ['client'], activeRole: 'client' })
  const conversation = await Conversation.create({
    type: 'direct', participantIds: [sender.id, recipient.id], createdAt: new Date(now - 86_400_000),
    messageDigestNextCheckAt: new Date(now - 1000), messageDigestRevision: 1,
  })
  const messages = await Message.create(Array.from({ length: count }, (_, index) => ({
    conversationId: conversation.id, senderId: sender.id, senderName: 'Alice', type: 'text' as const, content: 'Bonjour',
    createdAt: new Date(now - ageMinutes * 60_000 + index),
  })))
  return { sender, recipient, conversation, messages }
}

async function wake(id: string) {
  await Conversation.updateOne({ _id: id }, { $set: { messageDigestNextCheckAt: new Date(0) } })
}

describe('rappels durables de messagerie', () => {
  it('rappelle un message isole oublie sans nouvel envoi, puis ne repete pas le meme lot', async () => {
    const { conversation, recipient } = await seed()
    expect((await sendPendingMessageDigests()).sent).toBe(1)
    expect(sendEmail).toHaveBeenCalledWith(recipient.email, expect.objectContaining({ subject: '1 message attend ta réponse' }), {
      idempotencyKey: expect.stringMatching(/^message-digest\//),
    })
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).sent).toBe(0)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('rappelle dix messages recents sans imposer trente minutes', async () => {
    await seed(10, 1)
    expect((await sendPendingMessageDigests()).sent).toBe(1)
    expect(vi.mocked(sendEmail).mock.calls[0][1].subject).toBe('10 messages attendent ta réponse')
  })

  it('attend pour neuf messages recents et conserve le reveil', async () => {
    const { conversation } = await seed(9, 1)
    expect((await sendPendingMessageDigests()).sent).toBe(0)
    expect((await Conversation.findById(conversation.id))?.messageDigestNextCheckAt).not.toBeNull()
  })

  it('ne notifie pas une personne active meme avec le statut public invisible', async () => {
    const { recipient, conversation } = await seed(10)
    await User.updateOne({ _id: recipient.id }, { $set: { lastSeenAt: new Date(), 'privacy.showOnline': false } })
    expect((await sendPendingMessageDigests()).sent).toBe(0)
    await User.updateOne({ _id: recipient.id }, { $set: { lastSeenAt: new Date(0) } })
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).sent).toBe(1)
  })

  it.each(['read', 'reply', 'muted', 'left', 'blocked', 'blockedBySender', 'deleted', 'disabled', 'readBy'])(
    'recontrole %s avant le rappel', async (mode) => {
      const { recipient, sender, conversation } = await seed(10)
      if (mode === 'read') await Conversation.updateOne({ _id: conversation.id }, { $set: { [`lastReadAt.${recipient.id}`]: new Date() } })
      if (mode === 'reply') {
        await Message.create({ conversationId: conversation.id, senderId: recipient.id, type: 'text', content: 'Reponse' })
        // Aucun rappel vers l'autre participant actif non plus.
        await User.updateOne({ _id: sender.id }, { $set: { lastSeenAt: new Date() } })
      }
      if (mode === 'muted') await Conversation.updateOne({ _id: conversation.id }, { $addToSet: { mutedConversationByUserIds: recipient.id } })
      if (mode === 'left') await Conversation.updateOne({ _id: conversation.id }, { $pull: { participantIds: recipient.id } })
      if (mode === 'blocked') await User.updateOne({ _id: recipient.id }, { $addToSet: { blockedUserIds: sender.id } })
      if (mode === 'blockedBySender') await User.updateOne({ _id: sender.id }, { $addToSet: { blockedUserIds: recipient.id } })
      if (mode === 'deleted') await Message.updateMany({}, { $set: { deletedForAll: true } })
      if (mode === 'disabled') await User.updateOne({ _id: recipient.id }, { $set: { disabled: true } })
      if (mode === 'readBy') await Message.updateMany({}, { $set: { [`readBy.${recipient.id}`]: new Date() } })
      expect((await sendPendingMessageDigests()).sent).toBe(0)
      expect(sendEmail).not.toHaveBeenCalled()
    },
  )

  it('deux crons simultanes ne prennent pas le meme lot', async () => {
    await seed(10)
    const results = await Promise.all([sendPendingMessageDigests(), sendPendingMessageDigests()])
    expect(results.reduce((total, result) => total + result.sent, 0)).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('reprend une panne avec la meme cle et le meme contenu sans marquer un envoi reussi', async () => {
    const { conversation, recipient } = await seed(10)
    vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, error: 'email_provider_error' })
    expect((await sendPendingMessageDigests()).failed).toBe(1)
    const failed = await MessageDigest.findOne({ recipientId: recipient.id })
    expect(failed?.lastSentAt).toBeNull()
    expect(failed?.pendingKey).toBeTruthy()
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).sent).toBe(1)
    expect(vi.mocked(sendEmail).mock.calls[1]).toEqual(vi.mocked(sendEmail).mock.calls[0])
  })

  it('reprend un bail expire apres interruption', async () => {
    const { conversation } = await seed()
    await Conversation.updateOne({ _id: conversation.id }, { $set: { messageDigestLeaseUntil: new Date(0), messageDigestLeaseToken: 'old-worker' } })
    expect((await sendPendingMessageDigests()).sent).toBe(1)
  })

  it('annule un rappel en reprise si les messages ont ete lus entre-temps', async () => {
    const { conversation, recipient } = await seed(10)
    vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, error: 'email_provider_error' })
    await sendPendingMessageDigests()
    await Conversation.updateOne({ _id: conversation.id }, { $set: { [`lastReadAt.${recipient.id}`]: new Date() } })
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).sent).toBe(0)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect((await MessageDigest.findOne({ recipientId: recipient.id }))?.pendingKey).toBeNull()
  })

  it('bloque une relance incertaine au-dela de la fenetre fournisseur', async () => {
    const { conversation, recipient } = await seed(10)
    vi.mocked(sendEmail).mockResolvedValueOnce({ ok: false, error: 'email_provider_error' })
    await sendPendingMessageDigests()
    await MessageDigest.updateOne({ recipientId: recipient.id }, { $set: { attemptedAt: new Date(Date.now() - 24 * 3_600_000) } })
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).uncertain).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect((await MessageDigest.findOne({ recipientId: recipient.id }))?.lastError).toBe('delivery_confirmation_required')
  })

  it('respecte le cooldown pour un nouveau lot et conserve les messages arrives pendant le traitement', async () => {
    const { sender, recipient, conversation } = await seed(10)
    vi.mocked(sendEmail).mockImplementationOnce(async () => {
      await Message.create(Array.from({ length: 10 }, () => ({ conversationId: conversation.id, senderId: sender.id, type: 'text' as const, content: 'Suite' })))
      await Conversation.updateOne({ _id: conversation.id }, { $inc: { messageDigestRevision: 1 }, $set: { messageDigestNextCheckAt: new Date() } })
      return { ok: true }
    })
    expect((await sendPendingMessageDigests({ limit: 1 })).sent).toBe(1)
    expect((await sendPendingMessageDigests()).sent).toBe(0)
    await MessageDigest.updateOne({ recipientId: recipient.id }, { $set: { lastSentAt: new Date(Date.now() - 3_600_001) } })
    await wake(conversation.id)
    expect((await sendPendingMessageDigests()).sent).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })
})
