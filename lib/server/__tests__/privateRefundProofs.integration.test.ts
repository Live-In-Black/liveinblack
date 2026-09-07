import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import RefundCase from '@/lib/models/RefundCase'
import RefundProof from '@/lib/models/RefundProof'
import { REFUND_PROOF_MAX_BYTES, readPrivateRefundProof, storePrivateRefundProof } from '../refunds/privateProofs'
import { declareIndividualRefund } from '../refunds/refundCases'

vi.mock('../emails/notify', () => ({ notifyUserById: vi.fn(async () => {}) }))

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6QAAAABJRU5ErkJggg==', 'base64')
beforeAll(async () => { vi.stubEnv('REFUND_CODE_SECRET', 'isolated-proof-test-key'); await getDb() })
beforeEach(async () => { await RefundCase.deleteMany({}); await RefundProof.deleteMany({}) })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); vi.unstubAllEnvs() })

async function seed() {
  return RefundCase.create({ idempotencyKey: 'proof-test', eventId: new mongoose.Types.ObjectId().toString(), orderId: 'order', buyerId: 'buyer', organizerId: 'organizer',
    cause: 'event_cancelled', flow: 'individual', status: 'to_refund', facialMinor: 10000, serviceFeeMinor: 500, refundableMinor: 10500 })
}

async function upload() {
  const refund = await seed()
  const stored = await storePrivateRefundProof('organizer', refund.id, png, 'image/png')
  if (!stored.ok) throw new Error(stored.error)
  return { refund, stored }
}

describe('justificatifs chiffres prives de remboursement', () => {
  it('conserve exactement l original chiffre sans URL publique ni nom de fichier utilisateur', async () => {
    const { stored } = await upload()
    const raw = await RefundProof.collection.findOne({ _id: new mongoose.Types.ObjectId(stored.proofId) })
    expect(JSON.stringify(raw)).not.toContain(png.toString('base64'))
    expect((await RefundProof.findById(stored.proofId).lean())?.encryptedOriginal).toBeUndefined()
    const read = await readPrivateRefundProof('organizer', stored.proofId)
    expect(read.ok).toBe(true)
    if (read.ok) expect(read.bytes.equals(png)).toBe(true)
    expect(await RefundProof.collection.findOne({ _id: raw!._id })).toEqual(raw)
  })

  it('refuse au tiers et au client les brouillons ; autorise le client apres rattachement', async () => {
    const { stored, refund } = await upload()
    expect((await readPrivateRefundProof('other', stored.proofId)).ok).toBe(false)
    expect((await readPrivateRefundProof('buyer', stored.proofId)).ok).toBe(false)
    await RefundCase.updateOne({ _id: refund._id }, { $push: { proofs: { proofId: stored.proofId, url: stored.url, uploadedBy: 'organizer' } } })
    expect((await readPrivateRefundProof('buyer', stored.proofId)).ok).toBe(true)
    expect((await readPrivateRefundProof('agent', stored.proofId)).ok).toBe(false)
    const row = await RefundCase.findById(refund._id).lean()
    expect(row?.auditTrail.filter(entry => entry.action === 'proof_read')).toHaveLength(1)
  })

  it.each(['declared', 'reimbursed', 'code_active', 'info_required'])('refuse un nouvel original au statut %s', async status => {
    const refund = await seed()
    await RefundCase.updateOne({ _id: refund._id }, { $set: { status } })
    expect((await storePrivateRefundProof('organizer', refund.id, png, 'image/png')).ok).toBe(false)
    expect(await RefundProof.countDocuments()).toBe(0)
  })

  it('refuse un autre organisateur, les identifiants invalides et les fichiers invalides', async () => {
    const refund = await seed()
    expect((await storePrivateRefundProof('other', refund.id, png, 'image/png')).ok).toBe(false)
    expect((await storePrivateRefundProof('organizer', 'bad', png, 'image/png')).ok).toBe(false)
    expect((await readPrivateRefundProof('organizer', 'bad')).ok).toBe(false)
    expect(await storePrivateRefundProof('organizer', refund.id, Buffer.from('<svg/>'), 'image/png')).toMatchObject({ status: 415 })
    expect(await storePrivateRefundProof('organizer', refund.id, png, 'text/html')).toMatchObject({ status: 415 })
    expect(await storePrivateRefundProof('organizer', refund.id, Buffer.alloc(REFUND_PROOF_MAX_BYTES + 1), 'image/png')).toMatchObject({ status: 413 })
    expect(await RefundProof.countDocuments()).toBe(0)
  })

  it('refuse un original altere et ne publie pas son contenu', async () => {
    const { stored } = await upload()
    await RefundProof.collection.updateOne({ _id: new mongoose.Types.ObjectId(stored.proofId) }, { $set: { encryptedOriginal: 'invalid' } })
    expect(await readPrivateRefundProof('organizer', stored.proofId)).toEqual({ ok: false, status: 503, error: 'proof_unavailable' })
  })

  it('annule aussi le journal si le stockage chiffre echoue', async () => {
    const refund = await seed()
    const spy = vi.spyOn(RefundProof, 'create').mockRejectedValueOnce(new Error('storage-failure'))
    try { await expect(storePrivateRefundProof('organizer', refund.id, png, 'image/png')).rejects.toThrow('storage-failure') }
    finally { spy.mockRestore() }
    expect((await RefundCase.findById(refund._id).lean())?.auditTrail).toHaveLength(0)
  })

  it('refuse de substituer le contenu chiffre d une autre preuve', async () => {
    const { stored, refund } = await upload()
    const second = await storePrivateRefundProof('organizer', refund.id, png, 'image/png')
    if (!second.ok) throw new Error(second.error)
    const source = await RefundProof.findById(second.proofId).select('+encryptedOriginal').lean()
    await RefundProof.collection.updateOne({ _id: new mongoose.Types.ObjectId(stored.proofId) }, { $set: { encryptedOriginal: source!.encryptedOriginal } })
    expect(await readPrivateRefundProof('organizer', stored.proofId)).toMatchObject({ ok: false, status: 503 })
  })

  it('retire la lecture si le dossier change de proprietaire', async () => {
    const { stored, refund } = await upload()
    await RefundCase.updateOne({ _id: refund._id }, { $set: { organizerId: 'new-owner' } })
    expect((await readPrivateRefundProof('organizer', stored.proofId)).ok).toBe(false)
    expect((await readPrivateRefundProof('new-owner', stored.proofId)).ok).toBe(false)
  })

  it('rattache une preuve privee valide lors de la declaration et ouvre la lecture au client', async () => {
    const { stored, refund } = await upload()
    expect((await readPrivateRefundProof('buyer', stored.proofId)).ok).toBe(false)
    expect(await declareIndividualRefund('organizer', refund.id, { reference: 'PRIVATE-1', channel: 'Banque', proofId: stored.proofId })).toEqual({ ok: true })
    expect((await readPrivateRefundProof('buyer', stored.proofId)).ok).toBe(true)
    const updated = await RefundCase.findById(refund.id).lean()
    expect(updated?.proofs[0]).toMatchObject({ proofId: stored.proofId, url: stored.url })
    expect(updated?.status).toBe('declared')
  })

  it.each(['other-case', 'other-owner', 'corrupted', 'missing'])('refuse la declaration avec une preuve %s sans changer le dossier', async variant => {
    const { stored, refund } = await upload()
    const id = new mongoose.Types.ObjectId(stored.proofId)
    if (variant === 'other-case') await RefundProof.collection.updateOne({ _id: id }, { $set: { refundCaseId: new mongoose.Types.ObjectId().toString() } })
    if (variant === 'other-owner') await RefundProof.collection.updateOne({ _id: id }, { $set: { ownerId: 'other' } })
    if (variant === 'corrupted') await RefundProof.collection.updateOne({ _id: id }, { $set: { encryptedOriginal: 'bad' } })
    if (variant === 'missing') await RefundProof.collection.deleteOne({ _id: id })
    expect(await declareIndividualRefund('organizer', refund.id, { reference: 'PRIVATE-1', channel: 'Banque', proofId: stored.proofId })).toMatchObject({ error: 'invalid_private_proof' })
    const updated = await RefundCase.findById(refund.id).lean()
    expect(updated?.status).toBe('to_refund')
    expect(updated?.proofs).toHaveLength(0)
    expect(updated?.declaredReference).toBeNull()
  })
})
