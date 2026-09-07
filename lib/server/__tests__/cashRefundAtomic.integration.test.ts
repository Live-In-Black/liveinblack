import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import RefundPoint from '@/lib/models/RefundPoint'
import { hashRefundPickupCode } from '@/lib/shared/refundPolicy'
import { completeManualRefund } from '../agent/agentPayments'
import { switchCashPickupToIndividual } from '../refunds/refundCases'
import { notifyUserById } from '../emails/notify'
import { testRefundSignature } from './fixtures/refundSignature'
import { readRefundSignature } from '../refunds/signatures'
import { listParticipantRefundCases } from '../refunds/refundCases'
import { prepareCashRefund, releaseCashRefund } from '../refunds/cashOperations'

vi.mock('../emails/notify', () => ({ notifyUserById: vi.fn(async () => {}) }))
const RUN_INTEGRATION = Boolean(process.env.MONGODB_URI)
const describeIntegration = describe.skipIf(!RUN_INTEGRATION)
const agent = { id: 'agent-1', name: 'Agent' }
const input = { code: 'PRIVATE-CODE-123', signatureDataUrl: '' }
const operationId = '11111111-1111-4111-8111-111111111111'
beforeAll(async () => {
  if (!RUN_INTEGRATION) return
  input.signatureDataUrl = await testRefundSignature()
  await getDb()
  await RefundCase.init()
  await RefundPoint.init()
}, 20000)
beforeEach(async () => {
  if (!RUN_INTEGRATION) return
  vi.restoreAllMocks()
  vi.clearAllMocks()
  await RefundCase.deleteMany({})
  await RefundPoint.deleteMany({})
})
afterAll(async () => {
  if (!RUN_INTEGRATION) return
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

async function seed() {
  const point = await RefundPoint.create({ name: 'Point Cotonou', address: 'Cotonou', agentIds: [agent.id, 'agent-2'] })
  const refund = await RefundCase.create({
    idempotencyKey: new mongoose.Types.ObjectId().toString(), eventId: new mongoose.Types.ObjectId().toString(), orderId: new mongoose.Types.ObjectId().toString(),
    buyerId: 'buyer', organizerId: 'organizer', cause: 'event_cancelled', flow: 'cash_pickup', status: 'code_active',
    currency: 'XOF', facialMinor: 10000, serviceFeeMinor: 500, refundableMinor: 10500,
    refundPointId: point.id, codeHash: hashRefundPickupCode(input.code),
  })
  return { point, refund }
}

describeIntegration('retrait cash atomique avec la caisse et les missions', () => {
  it('exige une preparation avant la remise quand un identifiant operation est fourni', async () => {
    const { point, refund } = await seed()
    expect(await completeManualRefund(agent, refund.id, { ...input, operationId })).toMatchObject({ ok: false, error: 'cash_operation_required' })
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursedMinor).toBe(0)

    expect(await prepareCashRefund(agent.id, refund.id, input.code, operationId)).toMatchObject({ ok: true, state: 'prepared', amountXOF: 10500 })
    expect(await completeManualRefund(agent, refund.id, { ...input, operationId })).toEqual({ ok: true })
    expect(await RefundPoint.findById(point.id).lean()).toMatchObject({ cashDisbursedMinor: 10500, cashDisbursementCount: 1 })
  })

  it('reprend une operation deja preparee ou terminee sans ouvrir une deuxieme remise', async () => {
    const { point, refund } = await seed()
    await expect(Promise.all([
      prepareCashRefund(agent.id, refund.id, input.code, operationId),
      prepareCashRefund('agent-2', refund.id, input.code, '22222222-2222-4222-8222-222222222222'),
    ])).resolves.toContainEqual(expect.objectContaining({ ok: true, operationId }))

    const preparedAgain = await prepareCashRefund(agent.id, refund.id, input.code, operationId)
    expect(preparedAgain).toMatchObject({ ok: true, state: 'prepared', amountXOF: 10500 })
    await completeManualRefund(agent, refund.id, { ...input, operationId })
    expect(await prepareCashRefund(agent.id, refund.id, input.code, operationId)).toMatchObject({ ok: true, state: 'completed', operationId })
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursementCount).toBe(1)
  })

  it('libere seulement une operation non remise et interdit sa resurrection', async () => {
    const { point, refund } = await seed()
    expect(await prepareCashRefund(agent.id, refund.id, input.code, operationId)).toMatchObject({ ok: true })
    expect(await releaseCashRefund(agent.id, refund.id, operationId, true)).toEqual({ ok: true })
    expect(await prepareCashRefund(agent.id, refund.id, input.code, operationId)).toMatchObject({ ok: false, error: 'cash_operation_released' })
    expect(await completeManualRefund(agent, refund.id, { ...input, operationId })).toMatchObject({ ok: false, error: 'cash_operation_required' })
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursedMinor).toBe(0)
  })

  it('empeche la bascule individuelle pendant une preparation cash active', async () => {
    const { refund } = await seed()
    expect(await prepareCashRefund(agent.id, refund.id, input.code, operationId)).toMatchObject({ ok: true })
    expect(await switchCashPickupToIndividual('buyer', refund.id)).toMatchObject({ ok: false })
    const fresh = await RefundCase.findById(refund.id).select('+cashOperationId').lean()
    expect(fresh).toMatchObject({ flow: 'cash_pickup', status: 'code_active', cashOperationId: operationId })
  })

  it('cloture dossier et caisse une seule fois pour deux agents concurrents', async () => {
    const { point, refund } = await seed()
    const outcomes = await Promise.all([
      completeManualRefund(agent, refund.id, input),
      completeManualRefund({ id: 'agent-2', name: 'Autre agent' }, refund.id, input),
    ])
    expect(outcomes.filter(result => result.ok)).toHaveLength(1)
    expect(await RefundPoint.findById(point.id).lean()).toMatchObject({ cashDisbursedMinor: 10500, cashDisbursementCount: 1 })
    const updated = await RefundCase.findById(refund.id).lean()
    expect(updated?.status).toBe('reimbursed')
    expect(updated?.auditTrail.filter(entry => entry.action === 'cash_redeemed')).toHaveLength(1)
    expect(notifyUserById).toHaveBeenCalledTimes(1)
    expect(vi.mocked(notifyUserById).mock.calls[0][1]().subject).toContain('Retrait en espèces enregistré')
  })

  it('annule dossier, signature et journal si la caisse echoue apres cloture', async () => {
    const { point, refund } = await seed()
    const update = RefundPoint.updateOne.bind(RefundPoint)
    vi.spyOn(RefundPoint, 'updateOne').mockImplementation(((filter: unknown, changes: { $inc?: { cashDisbursedMinor?: number } }, options: unknown) => {
      if (changes.$inc?.cashDisbursedMinor) throw new Error('cash-write-failed')
      return update(filter as never, changes, options as never)
    }) as typeof RefundPoint.updateOne)
    await expect(completeManualRefund(agent, refund.id, input)).rejects.toThrow('cash-write-failed')
    expect(await RefundPoint.findById(point.id).lean()).toMatchObject({ cashDisbursedMinor: 0, cashDisbursementCount: 0, refundOperationRevision: 0 })
    expect(await RefundCase.findById(refund.id).lean()).toMatchObject({ status: 'code_active', signatureUrl: null, codeRedeemedAt: null, auditTrail: [] })
    expect(notifyUserById).not.toHaveBeenCalled()
  })

  it('revocation de mission apres lecture : aucune remise ni caisse validee', async () => {
    const { point, refund } = await seed()
    const update = RefundPoint.updateOne.bind(RefundPoint)
    let revoke = true
    vi.spyOn(RefundPoint, 'updateOne').mockImplementation((async (...args: Parameters<typeof RefundPoint.updateOne>) => {
      if (revoke) { revoke = false; await RefundPoint.collection.updateOne({ _id: point._id }, { $set: { agentIds: ['agent-2'] } }) }
      return update(...args)
    }) as unknown as typeof RefundPoint.updateOne)
    expect(await completeManualRefund(agent, refund.id, input)).toMatchObject({ ok: false, status: 403 })
    expect((await RefundCase.findById(refund.id).lean())?.status).toBe('code_active')
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursementCount).toBe(0)
  })

  it('bascule individuelle apres lecture : annule le retrait et sa caisse', async () => {
    const { point, refund } = await seed()
    const update = RefundPoint.updateOne.bind(RefundPoint)
    let switchFlow = true
    vi.spyOn(RefundPoint, 'updateOne').mockImplementation((async (...args: Parameters<typeof RefundPoint.updateOne>) => {
      if (switchFlow) {
        switchFlow = false
        expect(await switchCashPickupToIndividual('buyer', refund.id)).toEqual({ ok: true })
      }
      return update(...args)
    }) as unknown as typeof RefundPoint.updateOne)
    expect((await completeManualRefund(agent, refund.id, input)).ok).toBe(false)
    expect(await RefundCase.findById(refund.id).lean()).toMatchObject({ flow: 'individual', status: 'switched_individual', codeRedeemedAt: null })
    expect(await RefundPoint.findById(point.id).lean()).toMatchObject({ cashDisbursementCount: 0, refundOperationRevision: 0 })
  })

  it.each(['inactive', 'wrong-point'])('refuse un point %s sans compter un faux essai', async kind => {
    const { point, refund } = await seed()
    await RefundPoint.updateOne({ _id: point._id }, { $set: kind === 'inactive' ? { active: false } : { agentIds: ['other'] } })
    expect((await completeManualRefund(agent, refund.id, input)).ok).toBe(false)
    expect((await RefundCase.findById(refund.id).lean())?.codeAttemptCount).toBe(0)
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursementCount).toBe(0)
  })

  it('limite cinq essais meme concurrents et refuse ensuite le bon code', async () => {
    const { point, refund } = await seed()
    const outcomes = await Promise.all(Array.from({ length: 10 }, (_, i) => completeManualRefund(agent, refund.id, { ...input, code: `BAD-CODE-${i}` })))
    expect(outcomes.every(outcome => !outcome.ok)).toBe(true)
    const locked = await RefundCase.findById(refund.id).lean()
    expect(locked?.status).toBe('technical_failure')
    expect(locked?.codeAttemptCount).toBe(5)
    expect(locked?.auditTrail.filter(entry => entry.action === 'cash_code_failed')).toHaveLength(5)
    expect(locked?.auditTrail.filter(entry => entry.action === 'cash_code_locked')).toHaveLength(1)
    expect(JSON.stringify(locked?.auditTrail)).not.toContain('BAD-CODE')
    expect(await completeManualRefund(agent, refund.id, input)).toMatchObject({ error: 'refund_code_locked' })
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursedMinor).toBe(0)
  })

  it.each(['individual', 'cancelled-code', 'missing-signature', 'invalid-amount'])('aucune remise pour %s', async state => {
    const { point, refund } = await seed()
    if (state === 'individual') await RefundCase.updateOne({ _id: refund._id }, { $set: { flow: 'individual' } })
    if (state === 'cancelled-code') await RefundCase.updateOne({ _id: refund._id }, { $set: { codeCancelledAt: new Date() } })
    if (state === 'invalid-amount') await RefundCase.updateOne({ _id: refund._id }, { $set: { refundableMinor: -1 } })
    const result = await completeManualRefund(agent, refund.id, { ...input, signatureDataUrl: state === 'missing-signature' ? '' : input.signatureDataUrl })
    expect(result.ok).toBe(false)
    expect((await RefundCase.findById(refund.id).lean())?.codeRedeemedAt).toBeNull()
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursedMinor).toBe(0)
  })

  it('echec du verrouillage : aucun compteur ni journal partiellement enregistre', async () => {
    const { point, refund } = await seed()
    await RefundCase.updateOne({ _id: refund._id }, { $set: { codeAttemptCount: 4 } })
    vi.spyOn(RefundCase, 'updateOne').mockRejectedValueOnce(new Error('lock-write-failed'))
    await expect(completeManualRefund(agent, refund.id, { ...input, code: 'BAD-LAST' })).rejects.toThrow('lock-write-failed')
    expect(await RefundCase.findById(refund.id).lean()).toMatchObject({ codeAttemptCount: 4, status: 'code_active', codeLockedAt: null, auditTrail: [] })
    expect((await RefundPoint.findById(point.id).lean())?.refundOperationRevision).toBe(0)
  })

  it('echec de notification apres commit ne provoque pas une seconde remise', async () => {
    const { point, refund } = await seed()
    vi.mocked(notifyUserById).mockRejectedValueOnce(new Error('mail-offline'))
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await completeManualRefund(agent, refund.id, input)).toEqual({ ok: true })
    expect((await completeManualRefund(agent, refund.id, input)).ok).toBe(false)
    expect((await RefundPoint.findById(point.id).lean())?.cashDisbursementCount).toBe(1)
    expect(warning).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(warning.mock.calls)).not.toContain(input.code)
  })

  it('original chiffre, lecture autorisee et aucune signature en clair dans les listes', async () => {
    const { point, refund } = await seed()
    await completeManualRefund(agent, refund.id, input)
    const raw = await RefundCase.collection.findOne({ _id: refund._id })
    expect(raw?.encryptedSignature).toBeTruthy()
    expect(JSON.stringify(raw)).not.toContain(input.signatureDataUrl)
    expect((await RefundCase.findById(refund.id).lean())?.encryptedSignature).toBeUndefined()
    for (const viewer of ['buyer', 'organizer', agent.id]) {
      const original = await readRefundSignature(viewer, refund.id)
      expect(original.ok).toBe(true)
      if (original.ok) expect(original.bytes.toString('base64')).toBe(input.signatureDataUrl.split(',')[1])
    }
    expect((await readRefundSignature('other', refund.id)).ok).toBe(false)
    await RefundPoint.updateOne({ _id: point.id }, { $set: { agentIds: [] } })
    expect((await readRefundSignature(agent.id, refund.id)).ok).toBe(false)
    const rows = await listParticipantRefundCases('buyer')
    expect(rows[0].proofs).toContainEqual({ url: `/api/refund-signatures/${refund.id}`, label: 'Signature du retrait' })
    expect(JSON.stringify(rows)).not.toContain(input.signatureDataUrl)
    expect((await RefundCase.collection.findOne({ _id: refund._id }))?.encryptedSignature).toBe(raw?.encryptedSignature)
  })

  it('refuse une signature chiffree transplantee sur un autre dossier', async () => {
    const first = await seed()
    const second = await seed()
    await completeManualRefund(agent, first.refund.id, input)
    await completeManualRefund(agent, second.refund.id, input)
    const original = await RefundCase.findById(first.refund.id).select('+encryptedSignature').lean()
    await RefundCase.updateOne({ _id: second.refund.id }, { $set: { encryptedSignature: original!.encryptedSignature } })
    expect((await readRefundSignature('buyer', second.refund.id)).ok).toBe(false)
  })
})
