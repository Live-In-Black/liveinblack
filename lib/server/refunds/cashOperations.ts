import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import RefundPoint from '@/lib/models/RefundPoint'
import { hashRefundPickupCode } from '@/lib/shared/refundPolicy'

const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i
const invalid = { ok: false, status: 409, error: 'cash_operation_unavailable' } as const
const forbidden = { ok: false, status: 403, error: 'agent_refund_point_required' } as const

export async function prepareCashRefund(agentId: string, refundId: string, code: string, operationId: string) {
  if (!agentId || !mongoose.isValidObjectId(refundId) || !uuid.test(operationId) || !code.trim() || code.length > 128) return invalid
  await getDb()
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(async () => {
      const refund = await RefundCase.findOne({ _id: refundId, flow: 'cash_pickup' })
        .select('+codeHash +cashOperationId +cashReleasedOperationIds').session(session).lean()
      if (!refund) return invalid
      // Touching the point serializes both the claim and its authorization with mission changes.
      const point = await RefundPoint.findOneAndUpdate(
        { _id: refund.refundPointId, active: true, agentIds: agentId },
        { $inc: { refundOperationRevision: 1 } }, { session, returnDocument: 'after' }
      ).lean()
      if (!point) return forbidden
      if (refund.cashReleasedOperationIds?.includes(operationId)) return { ok: false, status: 409, error: 'cash_operation_released' } as const
      const sameOperation = refund.cashOperationId === operationId && refund.cashOperationAgentId === agentId
      if (refund.status === 'reimbursed' && sameOperation && refund.codeHash === hashRefundPickupCode(code)) {
        return { ok: true, state: 'completed', amountXOF: refund.refundableMinor, pointName: point.name, operationId } as const
      }
      if (refund.status !== 'code_active' || refund.codeCancelledAt || refund.codeRedeemedAt) return invalid
      if (refund.cashOperationId && !sameOperation) return { ok: false, status: 409, error: 'cash_operation_in_progress' } as const
      const attempts = refund.codeAttemptCount ?? 0
      if (!Number.isSafeInteger(attempts) || attempts < 0 || attempts >= 5 || refund.codeLockedAt) return { ok: false, status: 429, error: 'refund_code_locked' } as const
      if (refund.codeHash !== hashRefundPickupCode(code)) {
        const count = attempts + 1
        const now = new Date()
        await RefundCase.updateOne({ _id: refund._id }, {
          $set: { codeAttemptCount: count, codeLastAttemptAt: now, ...(count >= 5 ? { status: 'technical_failure', codeLockedAt: now } : {}) },
          $push: { auditTrail: { $each: [
            { at: now, actorId: agentId, actorRole: 'agent', action: 'cash_code_failed', metadata: { source: 'prepare', pointId: String(point._id) } },
            ...(count >= 5 ? [{ at: now, actorId: agentId, actorRole: 'agent', action: 'cash_code_locked', metadata: { attemptCount: count } }] : []),
          ] } },
        }, { session })
        return { ok: false, status: count >= 5 ? 429 : 409, error: count >= 5 ? 'refund_code_locked' : 'invalid_or_already_redeemed_code' } as const
      }
      if (refund.currency !== 'XOF' || !Number.isSafeInteger(refund.refundableMinor) || refund.refundableMinor <= 0) return invalid
      if (!sameOperation) {
        await RefundCase.updateOne({ _id: refund._id }, {
          $set: { cashOperationId: operationId, cashOperationAgentId: agentId, cashOperationStartedAt: new Date() },
          $push: { auditTrail: { actorId: agentId, actorRole: 'agent', action: 'cash_operation_prepared', metadata: { pointId: String(point._id) } } },
        }, { session })
      }
      return { ok: true, state: 'prepared', amountXOF: refund.refundableMinor, pointName: point.name, operationId } as const
    })
  } finally { await session.endSession() }
}

export async function releaseCashRefund(agentId: string, refundId: string, operationId: string, noCashHanded: boolean) {
  if (!agentId || !mongoose.isValidObjectId(refundId) || !uuid.test(operationId) || noCashHanded !== true) return invalid
  await getDb()
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(async () => {
      const refund = await RefundCase.findOne({ _id: refundId, flow: 'cash_pickup', status: 'code_active' })
        .select('+cashOperationId +cashReleasedOperationIds').session(session).lean()
      if (!refund) return invalid
      const point = await RefundPoint.updateOne({ _id: refund.refundPointId, active: true, agentIds: agentId }, { $inc: { refundOperationRevision: 1 } }, { session })
      if (point.matchedCount !== 1) return forbidden
      if (refund.cashOperationId !== operationId || refund.cashOperationAgentId !== agentId) return invalid
      await RefundCase.updateOne({ _id: refund._id }, {
        $set: { cashOperationId: null, cashOperationAgentId: null, cashOperationStartedAt: null },
        $addToSet: { cashReleasedOperationIds: operationId },
        $push: { auditTrail: { actorId: agentId, actorRole: 'agent', action: 'cash_operation_released', metadata: { noCashHanded: true } } },
      }, { session })
      return { ok: true } as const
    })
  } finally { await session.endSession() }
}
