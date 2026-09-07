import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/agent/payments/refunds/[id]/complete/route'
import { GET } from '@/app/api/refund-signatures/[refundId]/route'
import { completeManualRefund } from '../agent/agentPayments'
import { readRefundSignature } from '../refunds/signatures'
import { checkRateLimit } from '../rateLimit'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('../agent/agentPayments', () => ({ completeManualRefund: vi.fn() }))
vi.mock('../refunds/refundCases', () => ({ auditContextFromRequest: vi.fn(() => ({})) }))
vi.mock('../refunds/signatures', () => ({ SIGNATURE_MAX_CHARACTERS: 700000, readRefundSignature: vi.fn() }))
vi.mock('../rateLimit', () => ({ checkRateLimit: vi.fn() }))
const context = { params: Promise.resolve({ id: 'a'.repeat(24) }) }
const readContext = { params: Promise.resolve({ refundId: 'a'.repeat(24) }) }
const request = (body: unknown) => new Request('https://example.test/complete', { method: 'POST', body: JSON.stringify(body) })
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: 'agent', activeRole: 'agent', status: 'active', name: 'Agent' } } as never)
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
})

describe('routes de signature privee', () => {
  it('refuse sans agent avant lecture du corps ou traitement image', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    expect((await POST(request({}), context)).status).toBe(403)
    expect(completeManualRefund).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect((await GET(request({}), readContext)).status).toBe(401)
  })
  it.each([{ signatureUrl: 'https://example.test/public.png' }, { signatureUpload: {} }])('refuse les anciens transports de signature', async data => {
    expect((await POST(request({ code: 'CODE-12345', ...data }), context)).status).toBe(400)
    expect(completeManualRefund).not.toHaveBeenCalled()
  })
  it('ne tronque plus une capture PNG de plus de 2000 caracteres', async () => {
    vi.mocked(completeManualRefund).mockResolvedValue({ ok: true })
    const signatureDataUrl = 'data:image/png;base64,' + 'a'.repeat(4096)
    const operationId = '11111111-1111-4111-8111-111111111111'
    expect((await POST(request({ code: 'CODE-12345', signatureDataUrl, operationId }), context)).status).toBe(200)
    expect(completeManualRefund).toHaveBeenCalledWith({ id: 'agent', name: 'Agent' }, 'a'.repeat(24), { code: 'CODE-12345', signatureDataUrl, operationId }, {})
  })
  it('borne le corps sans Content-Length avant tout decodage PNG', async () => {
    expect((await POST(request({ signatureDataUrl: 'a'.repeat(710000) }), context)).status).toBe(413)
    expect(completeManualRefund).not.toHaveBeenCalled()
  })
  it('respecte le quota avant traitement image', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfterSeconds: 20 })
    expect((await POST(request({}), context)).status).toBe(429)
    expect(completeManualRefund).not.toHaveBeenCalled()
  })
  it('telecharge seulement les octets autorises sans cache', async () => {
    vi.mocked(readRefundSignature).mockResolvedValue({ ok: true, bytes: Buffer.from([1, 2]) })
    const response = await GET(request({}), readContext)
    expect(readRefundSignature).toHaveBeenCalledWith('agent', 'a'.repeat(24))
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-disposition')).toContain('attachment')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2])
  })
})
