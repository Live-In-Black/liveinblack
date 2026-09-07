import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/organizer-refunds/[refundCaseId]/destination/route'
import { auth } from '@/auth'
import { readIndividualRefundDestination } from '../refunds/refundCases'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('../refunds/refundCases', () => ({ readIndividualRefundDestination: vi.fn(), auditContextFromRequest: vi.fn(() => ({})) }))
beforeEach(() => vi.resetAllMocks())
const request = () => new Request('https://example.test/api/organizer-refunds/test/destination', { method: 'POST' })
const context = { params: Promise.resolve({ refundCaseId: 'test' }) }

describe('route coordonnees confidentielles', () => {
  it('refuse sans session et ne consulte aucune donnee', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const response = await POST(request(), context)
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(readIndividualRefundDestination).not.toHaveBeenCalled()
  })

  it('ne renvoie que le dossier autorise et interdit le cache', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'organizer' } } as never)
    vi.mocked(readIndividualRefundDestination).mockResolvedValue({ ok: true, details: 'Coordonnees test', version: 'version', destinationType: 'bank_account', canVerify: true })
    const response = await POST(request(), context)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(readIndividualRefundDestination).toHaveBeenCalledWith('organizer', 'test', {})
    expect(await response.json()).toMatchObject({ details: 'Coordonnees test' })
  })

  it('ne divulgue pas de coordonnees apres refus du service', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'other' } } as never)
    vi.mocked(readIndividualRefundDestination).mockResolvedValue({ ok: false, status: 404, error: 'not_found' })
    const response = await POST(request(), context)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not_found' })
  })
})
