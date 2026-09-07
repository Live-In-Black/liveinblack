import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/cron/refund-emails/route'
import { sendPendingContestEmails } from '../refunds/contestEmails'

vi.mock('../refunds/contestEmails', () => ({ sendPendingContestEmails: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe('cron des decisions de contestation', () => {
  it('refuse sans secret configure ou sans authentification', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(new Request('https://example.test/api/cron/refund-emails'))).status).toBe(500)
    vi.stubEnv('CRON_SECRET', 'test-only')
    expect((await GET(new Request('https://example.test/api/cron/refund-emails'))).status).toBe(401)
    expect(sendPendingContestEmails).not.toHaveBeenCalled()
  })
  it('execute apres authentification et signale les livraisons incertaines', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only')
    vi.mocked(sendPendingContestEmails).mockResolvedValue({ sent: 0, failed: 0, uncertain: 1 })
    const response = await GET(new Request('https://example.test/api/cron/refund-emails', { headers: { authorization: 'Bearer test-only' } }))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false, uncertain: 1 })
  })
})
