import { randomUUID } from 'node:crypto'
import { getDb } from '@/lib/db/mongoose'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import MessageDigest, { type MessageDigestDoc } from '@/lib/models/MessageDigest'
import User from '@/lib/models/User'
import { sendEmail } from '@/lib/server/email'
import { unreadMessagesReminderEmail } from '@/lib/server/emails/templates/messaging'
import {
  buildConversationMessageUrl,
  selectOfflineRecipientIds,
  shouldSendOfflineMessageDigest,
} from './messagingNotificationUtils'

const CHECK_INTERVAL_MS = 5 * 60_000
const LEASE_MS = 5 * 60_000
const PENDING_CLEAR = {
  pendingKey: null, pendingAt: null, pendingId: null, pendingCount: 0,
  pendingTo: null, pendingSubject: null, pendingHtml: null, attemptedAt: null,
}

async function loadUnread(conversationId: string, recipientId: string, state: MessageDigestDoc, pendingOnly = false) {
  const conversation = await Conversation.findById(conversationId)
  const recipient = await User.findById(recipientId).select('email disabled lastSeenAt blockedUserIds').lean()
  if (!conversation || !recipient?.email || recipient.disabled || !conversation.participantIds.includes(recipientId)
    || conversation.mutedConversationByUserIds.includes(recipientId) || conversation.hiddenByUserIds.includes(recipientId)) return null

  const senders = await User.find({
    _id: { $in: conversation.participantIds.filter((id) => id !== recipientId && !recipient.blockedUserIds.includes(id)) },
    blockedUserIds: { $ne: recipientId }, disabled: { $ne: true },
  }).select('_id').lean()
  const reply = await Message.findOne({ conversationId, senderId: recipientId, type: { $ne: 'system' } }).sort({ createdAt: -1 }).select('createdAt').lean()
  const cutoff = new Date(Math.max(
    conversation.lastReadAt.get(recipientId)?.getTime() ?? conversation.createdAt.getTime(),
    reply?.createdAt.getTime() ?? 0,
  ))
  const bounds: Record<string, unknown>[] = [{ createdAt: { $gt: cutoff } }]
  if (state.coveredAt && state.coveredId) bounds.push({ $or: [
    { createdAt: { $gt: state.coveredAt } },
    { createdAt: state.coveredAt, _id: { $gt: state.coveredId } },
  ] })
  if (pendingOnly && state.pendingAt && state.pendingId) bounds.push({ $or: [
    { createdAt: { $lt: state.pendingAt } },
    { createdAt: state.pendingAt, _id: { $lte: state.pendingId } },
  ] })
  const query = {
    conversationId, senderId: { $in: senders.map((user) => String(user._id)) },
    type: { $ne: 'system' as const }, deletedForAll: { $ne: true }, deletedForUserIds: { $ne: recipientId },
    [`readBy.${recipientId}`]: { $exists: false }, $and: bounds,
  }
  const oldest = await Message.findOne(query).sort({ createdAt: 1, _id: 1 }).select('createdAt').lean()
  if (!oldest) return null
  const newest = await Message.findOne(query).sort({ createdAt: -1, _id: -1 }).select('createdAt').lean()
  if (!newest) return null
  bounds.push({ $or: [
    { createdAt: { $lt: newest.createdAt } },
    { createdAt: newest.createdAt, _id: { $lte: String(newest._id) } },
  ] })
  const count = await Message.countDocuments(query)
  return {
    recipient, count, oldestAt: oldest.createdAt, newest,
    offline: selectOfflineRecipientIds([recipient]).length === 1,
    previousSentAt: conversation.messageDigestSentAt.get(recipientId),
  }
}

async function processRecipient(conversationId: string, recipientId: string, leaseToken: string, site: string) {
  const state = await MessageDigest.findOneAndUpdate(
    { conversationId, recipientId }, { $setOnInsert: { conversationId, recipientId } },
    { upsert: true, returnDocument: 'after' },
  )
  let unread = await loadUnread(conversationId, recipientId, state)
  if (!unread) {
    // Un rappel devenu caduc (lecture/reponse/blocage) n'est pas reconstitue.
    if (state.pendingKey) await MessageDigest.updateOne({ _id: state._id }, {
      $set: { coveredAt: state.pendingAt, coveredId: state.pendingId, ...PENDING_CLEAR },
    })
    return { pending: false, sent: false }
  }
  if (!unread.offline) return { pending: true, sent: false }
  if (!state.pendingKey) {
    if (!shouldSendOfflineMessageDigest(unread.count, state.lastSentAt ?? unread.previousSentAt, Date.now(), unread.oldestAt)) {
      return { pending: true, sent: false }
    }
    const email = unreadMessagesReminderEmail(unread.count, buildConversationMessageUrl(site, conversationId), site)
    Object.assign(state, {
      pendingKey: `message-digest/${randomUUID()}`, pendingAt: unread.newest.createdAt,
      pendingId: String(unread.newest._id), pendingCount: unread.count,
      pendingTo: unread.recipient.email, pendingSubject: email.subject, pendingHtml: email.html,
      lastError: null,
    })
    await state.save()
  }

  // Ne jamais reutiliser une cle hors de la fenetre d'idempotence du
  // fournisseur apres un resultat incertain : verification operateur requise.
  if (state.attemptedAt && Date.now() - state.attemptedAt.getTime() >= 23 * 60 * 60_000) {
    await MessageDigest.updateOne({ _id: state._id }, { $set: { lastError: 'delivery_confirmation_required' } })
    return { pending: true, sent: false, uncertain: true }
  }
  const owned = await Conversation.updateOne(
    { _id: conversationId, messageDigestLeaseToken: leaseToken, messageDigestLeaseUntil: { $gt: new Date() } },
    { $set: { messageDigestLeaseUntil: new Date(Date.now() + LEASE_MS) } },
  )
  if (owned.matchedCount !== 1) return { pending: true, sent: false }

  // Relecture au dernier moment, et non la presence/lecture capturee lors
  // de l'envoi du message. Le statut public "invisible" ne change rien ici.
  unread = await loadUnread(conversationId, recipientId, state, true)
  if (!unread || unread.count !== state.pendingCount || unread.recipient.email !== state.pendingTo) {
    await MessageDigest.updateOne({ _id: state._id }, {
      $set: { coveredAt: state.pendingAt, coveredId: state.pendingId, ...PENDING_CLEAR },
    })
    return { pending: true, sent: false }
  }
  if (!unread.offline) return { pending: true, sent: false }
  if (!state.attemptedAt) {
    state.attemptedAt = new Date()
    await state.save()
  }
  const result = await sendEmail(state.pendingTo!, {
    subject: state.pendingSubject!, html: state.pendingHtml!,
  }, { idempotencyKey: state.pendingKey! })
  if (!result.ok) {
    await MessageDigest.updateOne({ _id: state._id }, { $set: {
      lastError: result.error,
      ...(result.error === 'email-not-configured' ? { attemptedAt: null } : {}),
    } })
    return { pending: true, sent: false, failed: true }
  }
  await MessageDigest.updateOne({ _id: state._id, pendingKey: state.pendingKey }, {
    $set: { lastSentAt: new Date(), coveredAt: state.pendingAt, coveredId: state.pendingId, ...PENDING_CLEAR, lastError: null },
  })
  return { pending: true, sent: true }
}

export async function sendPendingMessageDigests(options: { limit?: number; site?: string } = {}) {
  await getDb()
  const site = options.site ?? process.env.PUBLIC_SITE_URL ?? 'https://liveinblack.com'
  const started = Date.now()
  const stats = { conversations: 0, sent: 0, failed: 0, uncertain: 0 }
  for (let index = 0; index < Math.min(options.limit ?? 50, 100) && Date.now() - started < 50_000; index++) {
    const token = randomUUID()
    const conversation = await Conversation.findOneAndUpdate({
      messageDigestNextCheckAt: { $ne: null, $lte: new Date() },
      $or: [{ messageDigestLeaseUntil: null }, { messageDigestLeaseUntil: { $lte: new Date() } }],
    }, { $set: { messageDigestLeaseUntil: new Date(Date.now() + LEASE_MS), messageDigestLeaseToken: token } }, {
      sort: { messageDigestNextCheckAt: 1 }, returnDocument: 'after',
    })
    if (!conversation) break
    stats.conversations++
    let pending = Boolean(conversation.messageDigestRecipientCursor)
    let recipientCursor = conversation.messageDigestRecipientCursor
    let completed = true
    try {
      await MessageDigest.updateMany({ conversationId: String(conversation._id), recipientId: { $nin: conversation.participantIds } }, {
        $set: PENDING_CLEAR,
      })
      for (const recipientId of [...conversation.participantIds].sort().filter((id) => !recipientCursor || id > recipientCursor)) {
        if (Date.now() - started >= 50_000) { pending = true; completed = false; break }
        const result = await processRecipient(String(conversation._id), recipientId, token, site)
        recipientCursor = recipientId
        pending ||= result.pending
        if (result.sent) stats.sent++
        if (result.failed) stats.failed++
        if (result.uncertain) stats.uncertain++
      }
    } catch (error) {
      pending = true
      completed = false
      stats.failed++
      console.error('[message-digests] processing failed', error instanceof Error ? error.name : 'unknown')
    }
    // Une nouvelle publication pendant le traitement doit conserver son
    // reveil durable, meme si le lot precedent ne contient plus de non-lus.
    await Conversation.updateOne({
      _id: conversation._id, messageDigestLeaseToken: token, messageDigestRevision: conversation.messageDigestRevision,
    }, { $set: { messageDigestNextCheckAt: pending ? new Date(Date.now() + CHECK_INTERVAL_MS) : null } })
    await Conversation.updateOne({ _id: conversation._id, messageDigestLeaseToken: token }, {
      $set: { messageDigestLeaseUntil: null, messageDigestLeaseToken: null, messageDigestRecipientCursor: completed ? null : recipientCursor },
    })
  }
  return stats
}
