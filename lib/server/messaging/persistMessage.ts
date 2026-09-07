import mongoose from 'mongoose'
import Conversation from '@/lib/models/Conversation'
import Message, { type MessageDoc } from '@/lib/models/Message'

type MessageInput = {
  conversationId: string
  senderId: string
  senderName: string
  type: MessageDoc['type']
  content?: string | null
  replyToMessageId?: string | null
  poll?: Record<string, unknown> | null
  forwardedFrom?: { senderName: string; convName: string }
}

export async function persistMessageWithWake(input: MessageInput, lastMessage: string) {
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(async () => {
      const [message] = await Message.create([input], { session })
      // A committed message must always have its durable digest wake-up.
      const updated = await Conversation.updateOne(
        { _id: input.conversationId, participantIds: input.senderId },
        {
          $set: { lastMessage, lastMessageAt: message.createdAt, lastSenderId: input.senderId, messageDigestNextCheckAt: new Date() },
          $inc: { messageDigestRevision: 1 },
        }, { session },
      )
      if (updated.matchedCount !== 1) throw new Error('conversation_unavailable')
      return message
    })
  } finally {
    await session.endSession()
  }
}
