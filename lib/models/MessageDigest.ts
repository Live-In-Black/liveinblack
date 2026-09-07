import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

// Etat durable d'un rappel : conserver la meme requete fournisseur lors
// d'une reprise apres interruption, sans renvoyer tout l'historique non lu.
const schema = new Schema({
  conversationId: { type: String, required: true },
  recipientId: { type: String, required: true },
  lastSentAt: { type: Date, default: null },
  coveredAt: { type: Date, default: null },
  coveredId: { type: String, default: null },
  pendingKey: { type: String, default: null },
  pendingAt: { type: Date, default: null },
  pendingId: { type: String, default: null },
  pendingCount: { type: Number, default: 0 },
  pendingTo: { type: String, default: null },
  pendingSubject: { type: String, default: null },
  pendingHtml: { type: String, default: null },
  attemptedAt: { type: Date, default: null },
  lastError: { type: String, default: null },
}, { timestamps: true })

schema.index({ conversationId: 1, recipientId: 1 }, { unique: true })
export type MessageDigestDoc = InferSchemaType<typeof schema>
export default (models.MessageDigest as Model<MessageDigestDoc>) || model<MessageDigestDoc>('MessageDigest', schema)
