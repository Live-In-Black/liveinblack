export const OFFLINE_MESSAGE_DIGEST_THRESHOLD_MS = 30 * 60 * 1000
export const OFFLINE_MESSAGE_DIGEST_UNREAD_THRESHOLD = 10
export const OFFLINE_MESSAGE_DIGEST_COOLDOWN_MS = 60 * 60 * 1000
export const MESSAGE_PRESENCE_WINDOW_MS = 45_000

export function shouldSendOfflineMessageDigest(
  unreadCount: number,
  lastSentAt: Date | string | null | undefined,
  nowMs = Date.now(),
  oldestUnreadAt?: Date | string | null,
): boolean {
  if (unreadCount <= 0) return false
  const waited = oldestUnreadAt != null && nowMs - new Date(oldestUnreadAt).getTime() >= OFFLINE_MESSAGE_DIGEST_THRESHOLD_MS
  if (unreadCount < OFFLINE_MESSAGE_DIGEST_UNREAD_THRESHOLD && !waited) return false
  if (!lastSentAt) return true
  const lastSentMs = new Date(lastSentAt).getTime()
  return !Number.isFinite(lastSentMs) || nowMs - lastSentMs >= OFFLINE_MESSAGE_DIGEST_COOLDOWN_MS
}

export function buildConversationMessagePath(conversationId: string): string {
  return `/messages?conversationId=${conversationId}`
}

export function buildConversationMessageUrl(site: string, conversationId: string): string {
  return `${site}${buildConversationMessagePath(conversationId)}`
}

export function buildMessagePushPayload(senderName: string, preview: string, conversationUrl: string) {
  return {
    title: `${senderName} t'a envoyé un message`,
    body: preview,
    url: conversationUrl,
  }
}

export function selectOfflineRecipientIds(
  recipients: Array<{ _id: unknown; lastSeenAt?: Date | string | null }>,
  nowMs = Date.now(),
  thresholdMs = MESSAGE_PRESENCE_WINDOW_MS,
): string[] {
  return recipients
    .filter((recipient) => {
      if (!recipient.lastSeenAt) return true
      const lastSeenMs = new Date(recipient.lastSeenAt).getTime()
      return !Number.isFinite(lastSeenMs) || nowMs - lastSeenMs > thresholdMs
    })
    .map((recipient) => String(recipient._id))
}
