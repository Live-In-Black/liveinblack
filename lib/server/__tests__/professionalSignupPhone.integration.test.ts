import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import { getDb } from '@/lib/db/mongoose'
import User from '@/lib/models/User'
import Application from '@/lib/models/Application'
import { uploadDataUri } from '@/lib/server/cloudinary'
import { registerAndSubmitOrganizerApplication, registerAndSubmitPrestataireApplication } from '../provider/applications'
import type { OrganizerFormData, PrestataireFormData } from '@/lib/shared/applicationValidation'

vi.mock('@/lib/server/cloudinary', () => ({ DOCUMENT_MIME_TYPES: ['image/png'], uploadDataUri: vi.fn(async () => ({ ok: true, publicId: 'local-identity', bytes: 100, format: 'png', resourceType: 'image', deliveryType: 'authenticated', version: 1 })) }))
vi.mock('@/lib/server/emails/notify', () => ({ notifyUserById: vi.fn(), notifyAllAgents: vi.fn() }))

beforeAll(async () => { await getDb(); await User.init() })
beforeEach(async () => { await User.deleteMany({}); await Application.deleteMany({}); vi.clearAllMocks() })
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect() })

function register(type: string, code: string, phone: string) {
  const common = { email: 'business@example.test', password: 'LocalTest123', documents: { identity: [{ name: 'identity.png', dataUri: 'data:image/png;base64,AA==' }] } }
  if (type === 'organisateur') return registerAndSubmitOrganizerApplication({ ...common, formData: {
    nomCommercial: 'Cotonou Studio', emailPro: 'business@example.test', telephoneProCode: code, telephonePro: phone,
    pays: 'Bénin', ville: 'Cotonou', noFixedAddress: true, typeEtablissement: 'Club',
    adresseEtablissement: '', siteWeb: '', typeEtablissementCustom: '', itinerant: false, zonesActivite: [],
    capacite: null, horaires: '', alcool: false, alcoolAtteste: false, description: '',
  } satisfies OrganizerFormData })
  return registerAndSubmitPrestataireApplication({ ...common, formData: {
    prenom: 'Test', nom: 'Prestataire', telephoneCode: code, telephone: phone,
    pays: 'Bénin', ville: 'Cotonou', prestataireType: 'photo_video', prestataireTypes: ['photo_video'],
    alcoolFood: false, alcoolFoodAtteste: false,
  } as PrestataireFormData })
}

describe.each(['organisateur', 'prestataire'])('professional contact %s', (type) => {
  it.each([
    ['+229', '01 96 12 34 56', '+2290196123456'],
    ['+33', '06 12 34 56 78', '+33612345678'],
    ['+39', '02 1234 5678', '+390212345678'],
  ])('stores canonical phone with a dedicated account (%s)', async (code, phone, expected) => {
    const result = await register(type, code, phone)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    const user = await User.findById(result.userId).lean()
    expect(user?.phone).toBe(expected)
    expect(user?.roles).toEqual([type])
    expect(user?.activeRole).toBe(type)
    const application = await Application.findOne({ userId: result.userId }).lean()
    expect(application?.status).toBe('submitted')
    expect(application?.type).toBe(type)
  })

  it('rejects malformed phone before creating account or uploading identity', async () => {
    expect((await register(type, '+33', 'phone0612345678')).ok).toBe(false)
    expect(await User.countDocuments()).toBe(0)
    expect(await Application.countDocuments()).toBe(0)
    expect(uploadDataUri).not.toHaveBeenCalled()
  })
})
