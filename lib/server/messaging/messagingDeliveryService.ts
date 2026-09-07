import Conversation from '@/lib/models/Conversation'
import User from '@/lib/models/User'
import Message from '@/lib/models/Message'
import { persistMessageWithWake } from './persistMessage'
import type { ConversationSource, MessageSource } from './messagingViews'
import type { HydratedDocument } from 'mongoose'
import type { ConversationDoc } from '@/lib/models/Conversation'
import type { SendableType } from './messagingSendUtils'
import { isSendableType, resolveLastMessageLabel } from './messagingSendUtils'
import {
  buildConversationMessagePath,
  buildConversationMessageUrl,
  buildMessagePushPayload,
  selectOfflineRecipientIds,
} from './messagingNotificationUtils'

export interface DeliverMessageCaller {
  id: string
}

export interface DeliverMessageInput {
  type: SendableType
  content: string
  replyToMessageId: string | null
  senderName: string
}

export interface DeliverMessageOptions {
  site: string
  deferSideEffects?: (work: () => Promise<void>) => void | Promise<void>
}

export interface DeliverMessageDependencies<TMessageView> {
  upsertMessageNotification: (
    recipientId: string,
    conversationId: string,
    preview: string,
    link: string,
  ) => Promise<void>
  sendPushToUser: (
    userId: string,
    payload: { title: string; body: string; url: string },
  ) => Promise<void>
  toMessageView: (
    message: MessageSource,
    ctx: {
      callerId: string
      conversation: ConversationSource
      readReceiptsAllowed: Map<string, boolean>
    },
  ) => TMessageView
}

async function runAfterMessageCommit(stage: 'in_app' | 'push' | 'push_dispatch', work: () => Promise<void>) {
  try {
    await work()
  } catch {
    // Never report a committed message as unsent, or log its private content.
    console.warn('[messaging] post_commit_notification_failed', { stage })
  }
}

async function loadNotificationRecipients(conversationId: string, senderId: string, originalIds: string[], messageId: string) {
  const fresh = await Conversation.findById(conversationId).lean()
  if (!fresh || !fresh.participantIds.includes(senderId)) return []
  const message = await Message.findOne({ _id: messageId, conversationId, senderId, deletedForAll: { $ne: true } })
    .select('createdAt readBy deletedForUserIds type content senderName').lean()
  if (!message || !isSendableType(message.type)) return []
  const notificationPreview = resolveLastMessageLabel(message.type, message.content || '')
  // Mongo maps are plain objects in lean results.
  const readBy = (message.readBy || {}) as unknown as Record<string, Date>
  const lastReadAt = (fresh.lastReadAt || {}) as unknown as Record<string, Date>
  const allowed = originalIds.filter(id => fresh.participantIds.includes(id)
    && !fresh.mutedConversationByUserIds.includes(id) && !fresh.hiddenByUserIds.includes(id)
    && !(message.deletedForUserIds || []).includes(id) && !readBy[id]
    && !(lastReadAt[id] && new Date(lastReadAt[id]).getTime() >= message.createdAt.getTime()))
  if (!allowed.length) return []
  const users = await User.find({ _id: { $in: [senderId, ...allowed] }, disabled: { $ne: true } })
    .select('lastSeenAt blockedUserIds').lean()
  const sender = users.find(user => String(user._id) === senderId)
  if (!sender) return []
  return users.filter(user => allowed.includes(String(user._id))
    && !sender.blockedUserIds.includes(String(user._id)) && !user.blockedUserIds.includes(senderId))
    .map(user => ({ ...user, notificationPreview, notificationSenderName: message.senderName }))
}

export async function deliverMessageForConversation<TMessageView>(
  caller: DeliverMessageCaller,
  conversation: HydratedDocument<ConversationDoc>,
  input: DeliverMessageInput,
  options: DeliverMessageOptions,
  {
    upsertMessageNotification,
    sendPushToUser,
    toMessageView,
  }: DeliverMessageDependencies<TMessageView>,
): Promise<{ ok: true; message: TMessageView }> {
  const lastMessageLabel = resolveLastMessageLabel(input.type, input.content)
  const created = await persistMessageWithWake({
    conversationId: String(conversation._id),
    senderId: caller.id,
    senderName: input.senderName,
    type: input.type,
    content: input.content,
    replyToMessageId: input.replyToMessageId,
  }, lastMessageLabel)

  const conversationIdStr = String(conversation._id)
  const recipientIds = conversation.participantIds.filter((id) => id !== caller.id)
  const conversationPath = buildConversationMessagePath(conversationIdStr)
  await runAfterMessageCommit('in_app', async () => {
    const recipients = await loadNotificationRecipients(conversationIdStr, caller.id, recipientIds, String(created._id))
    await Promise.all(recipients.map(recipient => runAfterMessageCommit('in_app', () =>
      upsertMessageNotification(String(recipient._id), conversationIdStr, recipient.notificationPreview, conversationPath))))
  })

  if (recipientIds.length) {
    const conversationUrl = buildConversationMessageUrl(options.site, conversationIdStr)
    const notifyOfflineRecipients = async () => {
      const recipients = await loadNotificationRecipients(conversationIdStr, caller.id, recipientIds, String(created._id))
      const offlineRecipientIds = new Set(selectOfflineRecipientIds(recipients))
      await Promise.all(
        recipients.filter(recipient => offlineRecipientIds.has(String(recipient._id))).map(async (recipient) => {
          await runAfterMessageCommit('push', () => sendPushToUser(
            String(recipient._id),
            buildMessagePushPayload(recipient.notificationSenderName, recipient.notificationPreview, conversationUrl),
          ))
        }),
      )
    }

    const safeNotify = () => runAfterMessageCommit('push_dispatch', notifyOfflineRecipients)
    if (options.deferSideEffects) {
      await runAfterMessageCommit('push_dispatch', async () => { await options.deferSideEffects!(safeNotify) })
    } else await safeNotify()
  }

  const conversationSource = conversation.toObject({ flattenMaps: true }) as ConversationSource
  return {
    ok: true,
    message: toMessageView(created.toObject({ flattenMaps: true }) as MessageSource, {
      callerId: caller.id,
      conversation: conversationSource,
      readReceiptsAllowed: new Map(),
    }),
  }
}
