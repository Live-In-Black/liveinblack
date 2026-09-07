import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/cron/message-digests/route'
import { sendPendingMessageDigests } from '../messaging/messageDigests'

vi.mock('../messaging/messageDigests', () => ({ sendPendingMessageDigests: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe('cron de rappels protege', () => {
  it('refuse sans configuration et sans secret valide', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(new Request('http://localhost/api/cron/message-digests'))).status).toBe(500)
    vi.stubEnv('CRON_SECRET', 'test-only')
    expect((await GET(new Request('http://localhost/api/cron/message-digests'))).status).toBe(401)
    expect(sendPendingMessageDigests).not.toHaveBeenCalled()
  })
  it('execute le traitement uniquement apres authentification', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only')
    vi.mocked(sendPendingMessageDigests).mockResolvedValue({ conversations: 1, sent: 1, failed: 0, uncertain: 0 })
    const response = await GET(new Request('http://localhost/api/cron/message-digests', { headers: { authorization: 'Bearer test-only' } }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, sent: 1 })
    expect(sendPendingMessageDigests).toHaveBeenCalledOnce()
  })
  it('rend visibles les echecs pour la supervision du cron', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only')
    vi.mocked(sendPendingMessageDigests).mockResolvedValue({ conversations: 1, sent: 0, failed: 0, uncertain: 1 })
    const response = await GET(new Request('http://localhost/api/cron/message-digests', { headers: { authorization: 'Bearer test-only' } }))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false, uncertain: 1 })
  })
})
