import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const schema = new Schema({
  refundCaseId: { type: String, required: true, immutable: true, index: true },
  ownerId: { type: String, required: true, immutable: true },
  encryptedOriginal: { type: String, required: true, immutable: true, select: false },
}, { timestamps: true })

type RefundProofDoc = InferSchemaType<typeof schema>
export default (models.RefundProof as Model<RefundProofDoc>) || model<RefundProofDoc>('RefundProof', schema)
