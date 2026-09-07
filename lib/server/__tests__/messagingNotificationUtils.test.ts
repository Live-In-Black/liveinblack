import { describe, expect, it } from 'vitest'
import {
  buildConversationMessagePath,
  buildConversationMessageUrl,
  buildMessagePushPayload,
  OFFLINE_MESSAGE_DIGEST_COOLDOWN_MS,
  OFFLINE_MESSAGE_DIGEST_THRESHOLD_MS,
  MESSAGE_PRESENCE_WINDOW_MS,
  shouldSendOfflineMessageDigest,
  selectOfflineRecipientIds,
} from '../messaging/messagingNotificationUtils'

describe('messagingNotificationUtils', () => {
  it('construit le chemin et l’URL de conversation', () => {
    expect(buildConversationMessagePath('conv-1')).toBe('/messages?conversationId=conv-1')
    expect(buildConversationMessageUrl('https://liveinblack.com', 'conv-1')).toBe('https://liveinblack.com/messages?conversationId=conv-1')
  })

  it('construit la charge utile push attendue', () => {
    expect(buildMessagePushPayload('Alice', 'Salut', 'https://liveinblack.com/messages?conversationId=conv-1')).toEqual({
      title: "Alice t'a envoyé un message",
      body: 'Salut',
      url: 'https://liveinblack.com/messages?conversationId=conv-1',
    })
  })

  it('sélectionne seulement les destinataires offline ou jamais vus', () => {
    const now = new Date('2026-08-20T17:10:00.000Z').getTime()
    expect(
      selectOfflineRecipientIds(
        [
          { _id: 'u1', lastSeenAt: null },
          { _id: 'u2', lastSeenAt: '2026-08-20T16:00:00.000Z' },
          { _id: 'u3', lastSeenAt: new Date(now - MESSAGE_PRESENCE_WINDOW_MS + 1_000) },
          { _id: 'u4', lastSeenAt: 'not-a-date' },
        ],
        now,
      ),
    ).toEqual(['u1', 'u2', 'u4'])
  })

  it('attend dix messages non lus et limite les digests à une heure', () => {
    const now = new Date('2026-08-20T17:10:00.000Z').getTime()
    expect(shouldSendOfflineMessageDigest(9, null, now)).toBe(false)
    expect(shouldSendOfflineMessageDigest(10, null, now)).toBe(true)
    expect(shouldSendOfflineMessageDigest(10, new Date(now - OFFLINE_MESSAGE_DIGEST_COOLDOWN_MS + 1_000), now)).toBe(false)
    expect(shouldSendOfflineMessageDigest(10, new Date(now - OFFLINE_MESSAGE_DIGEST_COOLDOWN_MS), now)).toBe(true)
  })

  it('rappelle un seul message apres la longue attente, sans imposer le seuil', () => {
    const now = Date.now()
    expect(shouldSendOfflineMessageDigest(1, null, now, new Date(now - OFFLINE_MESSAGE_DIGEST_THRESHOLD_MS))).toBe(true)
    expect(shouldSendOfflineMessageDigest(1, null, now, new Date(now - OFFLINE_MESSAGE_DIGEST_THRESHOLD_MS + 1))).toBe(false)
    expect(shouldSendOfflineMessageDigest(0, null, now, new Date(0))).toBe(false)
    expect(shouldSendOfflineMessageDigest(1, new Date(now), now, new Date(0))).toBe(false)
  })
})
