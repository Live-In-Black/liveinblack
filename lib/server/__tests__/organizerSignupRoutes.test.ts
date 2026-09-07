import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ register: vi.fn(), submit: vi.fn(), auth: vi.fn() }))
vi.mock('@/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/server/provider/applications', () => ({
  registerAndSubmitOrganizerApplication: mocks.register,
  submitOrganizerApplication: mocks.submit,
}))
vi.mock('@/lib/server/rateLimit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  getRequestIp: () => '127.0.0.1',
}))

import { POST as register } from '@/app/api/applications/organisateur/register/route'
import { POST as submit } from '@/app/api/applications/organisateur/submit/route'

const payload = {
  email: 'owner@example.com', password: 'LocalTest123',
  formData: {
    nomCommercial: 'Cotonou Studio', emailPro: 'contact@example.com',
    telephoneProCode: '+229', telephonePro: '0196123456',
    typeEtablissement: 'Club', ville: 'Cotonou', pays: 'Bénin', noFixedAddress: true,
  },
  documents: { identity: [{ name: 'identity.png', dataUri: 'data:image/png;base64,AA==' }] },
}

function request(body: unknown) {
  return new Request('http://localhost/api/applications/organisateur', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: 'organizer' } })
  mocks.register.mockResolvedValue({ ok: true, application: {}, userId: 'organizer' })
  mocks.submit.mockResolvedValue({ ok: true, application: {} })
})

describe('organizer signup API contract without enterprise identifier', () => {
  it('registers with identity only and no SIRET/RCCM/IFU field', async () => {
    expect((await register(request(payload))).status).toBe(200)
    expect(mocks.register).toHaveBeenCalledOnce()
    expect(mocks.register.mock.calls[0][0].formData).not.toHaveProperty('siret')
    expect(Object.keys(mocks.register.mock.calls[0][0].documents)).toEqual(['identity'])
  })

  it('submits an existing dedicated account without the removed field', async () => {
    expect((await submit(request(payload))).status).toBe(200)
    expect(mocks.submit.mock.calls[0][1].formData).not.toHaveProperty('siret')
  })

  it('ignores the removed field sent by an older client', async () => {
    expect((await register(request({ ...payload, formData: { ...payload.formData, siret: 'old-value' } }))).status).toBe(200)
    expect(mocks.register.mock.calls[0][0].formData).not.toHaveProperty('siret')
  })

  it('still rejects invalid account data before calling the service', async () => {
    expect((await register(request({ ...payload, password: 'weak' }))).status).toBe(400)
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('requires authentication to submit an existing application', async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await submit(request(payload))).status).toBe(401)
    expect(mocks.submit).not.toHaveBeenCalled()
  })
})
