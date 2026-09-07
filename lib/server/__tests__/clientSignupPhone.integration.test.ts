import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import User from '@/lib/models/User'
import { getDb } from '@/lib/db/mongoose'
import { sendEmail } from '@/lib/server/email'
import { POST } from '@/app/api/auth/register/route'

vi.mock('@/lib/server/email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }))
vi.mock('@/lib/auth/verification-tokens', () => ({ issueVerificationToken: vi.fn(async () => 'local-test-token') }))
vi.mock('@/lib/server/rateLimit', () => ({ checkRateLimit: vi.fn(async () => ({ allowed: true })), getRequestIp: () => '127.0.0.1' }))
vi.mock('@/lib/server/observability', () => ({ runObservedRoute: (_req: Request, _context: unknown, action: () => Promise<Response>) => action() }))

beforeAll(async () => { await getDb(); await User.init() })
beforeEach(async () => { await User.deleteMany({}); vi.clearAllMocks() })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

function register(phone?: string) {
  return POST(new Request('http://localhost/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    email: 'client-phone@example.test', password: 'LocalTest123', firstName: 'Test', lastName: 'Client', phone,
  }) }))
}

describe('client signup contact number storage', () => {
  it.each([
    ['+229 01 96 12 34 56', '+2290196123456'],
    ['+33 06 12 34 56 78', '+33612345678'],
    ['+39 02 1234 5678', '+390212345678'],
    ['+1 (415) 555-2671', '+14155552671'],
    [undefined, ''],
    ['', ''],
  ])('stores the normalized optional contact %s', async (phone, expected) => {
    expect((await register(phone)).status).toBe(201)
    const user = await User.findOne({ email: 'client-phone@example.test' }).lean()
    expect(user?.phone).toBe(expected)
    expect(user?.roles).toEqual(['client'])
    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it('rejects invalid contact input without creating a user or sending email', async () => {
    const response = await register('+33not-a-phone')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'invalid_phone' })
    expect(await User.countDocuments()).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('allows a shared contact without changing the existing professional account', async () => {
    const previous = await User.create({ email: 'previous@example.test', passwordHash: 'test', firstName: 'Test', lastName: 'Previous', roles: ['organisateur'], phone: '+33 06 12 34 56 78', emailVerifiedAt: new Date() })
    const response = await register('+33612345678')
    expect(response.status).toBe(201)
    expect(await User.countDocuments()).toBe(2)
    expect((await User.findById(previous.id))?.roles).toEqual(['organisateur'])
    expect((await User.findById(previous.id))?.phone).toBe('+33 06 12 34 56 78')
    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it.each(['client', 'organisateur', 'prestataire'] as const)('still rejects an email belonging to a %s account', async (role) => {
    await User.create({ email: 'client-phone@example.test', passwordHash: 'test', roles: [role], phone: '+33612345678', emailVerifiedAt: new Date() })
    const response = await register('+2290196123456')
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: 'email_taken' })
    expect(await User.countDocuments()).toBe(1)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
