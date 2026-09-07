import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/auth'
import { GET } from '@/app/api/refund-proofs/[proofId]/route'
import { POST } from '@/app/api/organizer-refunds/[refundCaseId]/proofs/route'
import { POST as DECLARE } from '@/app/api/organizer-refunds/[refundCaseId]/declare/route'
import { POST as SIGN } from '@/app/api/uploads/media/sign/route'
import { declareIndividualRefund } from '../refunds/refundCases'
import { createPublicMediaUploadSignature } from '../publicMediaUpload'
import { checkRateLimit } from '../rateLimit'
import { REFUND_PROOF_MAX_BYTES, readPrivateRefundProof, storePrivateRefundProof } from '../refunds/privateProofs'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('../rateLimit', () => ({ checkRateLimit: vi.fn() }))
vi.mock('../refunds/refundCases', () => ({ declareIndividualRefund: vi.fn(), auditContextFromRequest: vi.fn(() => ({})) }))
vi.mock('../publicMediaUpload', () => ({ createPublicMediaUploadSignature: vi.fn() }))
vi.mock('../refunds/privateProofs', () => ({ REFUND_PROOF_MAX_BYTES: 2 * 1024 * 1024, readPrivateRefundProof: vi.fn(), storePrivateRefundProof: vi.fn() }))
const readContext = { params: Promise.resolve({ proofId: 'proof' }) }
const uploadContext = { params: Promise.resolve({ refundCaseId: 'refund' }) }
const request = (body = new Uint8Array([1, 2, 3])) => new Request('https://example.test/proofs', { method: 'POST', body, headers: { 'Content-Type': 'image/png' } })
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: 'organizer' } } as never)
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
})

describe('routes des justificatifs prives', () => {
  it('refuse lecture et ecriture sans session avant tout acces aux donnees', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    expect((await GET(request(), readContext)).status).toBe(401)
    expect((await POST(request(), uploadContext)).status).toBe(401)
    expect(readPrivateRefundProof).not.toHaveBeenCalled()
    expect(storePrivateRefundProof).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
  })

  it('telecharge seulement l original autorise sans cache ni rendu HTML', async () => {
    vi.mocked(readPrivateRefundProof).mockResolvedValue({ ok: true, bytes: Buffer.from([1, 2]), mime: 'image/png', filename: 'justificatif-proof.png' })
    const response = await GET(request(), readContext)
    expect(readPrivateRefundProof).toHaveBeenCalledWith('organizer', 'proof')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="justificatif-proof.png"')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2])
  })

  it('ne divulgue aucun fichier apres refus du service', async () => {
    vi.mocked(readPrivateRefundProof).mockResolvedValue({ ok: false, status: 404, error: 'proof_not_found' })
    const response = await GET(request(), readContext)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'proof_not_found' })
  })

  it('borne le corps meme sans Content-Length', async () => {
    const response = await POST(request(new Uint8Array(REFUND_PROOF_MAX_BYTES + 1)), uploadContext)
    expect(response.status).toBe(413)
    expect(storePrivateRefundProof).not.toHaveBeenCalled()
  })

  it('limite les uploads par compte avant de lire le fichier', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 15 })
    const response = await POST(request(), uploadContext)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('15')
    expect(storePrivateRefundProof).not.toHaveBeenCalled()
  })

  it('transmet le fichier brut avec le compte authentifie et le dossier cible', async () => {
    vi.mocked(storePrivateRefundProof).mockResolvedValue({ ok: true, proofId: 'proof', url: '/api/refund-proofs/proof' })
    const response = await POST(request(), uploadContext)
    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(storePrivateRefundProof).toHaveBeenCalledWith('organizer', 'refund', Buffer.from([1, 2, 3]), 'image/png')
  })

  it.each([{ proofUrl: 'https://example.test/public.png' }, { proofUpload: {} }, { proofId: 'a'.repeat(24), proofUrl: 'https://example.test/public.png' }])('refuse une declaration avec ancien upload/URL : %j', async proof => {
    const response = await DECLARE(new Request('https://example.test/declare', { method: 'POST', body: JSON.stringify({ reference: 'REF-1', channel: 'Banque', ...proof }) }), uploadContext)
    expect(response.status).toBe(400)
    expect(declareIndividualRefund).not.toHaveBeenCalled()
  })

  it('transmet uniquement l identifiant prive au service transactionnel', async () => {
    vi.mocked(declareIndividualRefund).mockResolvedValue({ ok: true })
    const response = await DECLARE(new Request('https://example.test/declare', { method: 'POST', body: JSON.stringify({ reference: 'REF-1', channel: 'Banque', proofId: 'a'.repeat(24) }) }), uploadContext)
    expect(response.status).toBe(200)
    expect(declareIndividualRefund).toHaveBeenCalledWith('organizer', 'refund', { reference: 'REF-1', channel: 'Banque', proofId: 'a'.repeat(24), declaredAt: null }, {})
  })

  it('ne signe plus de justificatif public pour un organisateur', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'organizer', activeRole: 'organisateur' } } as never)
    const response = await SIGN(new Request('https://example.test/sign', { method: 'POST', body: JSON.stringify({ purpose: 'refund-proof', contentType: 'image/png', size: 100 }) }))
    expect(response.status).toBe(410)
    expect(createPublicMediaUploadSignature).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
  })

  it('ne signe plus de fichier public pour un agent non plus', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'agent', activeRole: 'agent' } } as never)
    vi.mocked(createPublicMediaUploadSignature).mockReturnValue({ ok: false, error: 'upload_not_configured' })
    const response = await SIGN(new Request('https://example.test/sign', { method: 'POST', body: JSON.stringify({ purpose: 'refund-proof', contentType: 'image/png', size: 100 }) }))
    expect(response.status).toBe(410)
    expect(createPublicMediaUploadSignature).not.toHaveBeenCalled()
  })
})
