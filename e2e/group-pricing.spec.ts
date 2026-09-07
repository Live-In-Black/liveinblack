import { test, expect } from 'playwright/test'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { loginSeededUser, dismissCookieBanner, seededPassword } from './helpers/auth'

const uri = process.env.MONGODB_TEST_URI || ''
test.skip(!uri, 'Base MongoDB de test explicite requise')
const organizerId = new ObjectId()
const buyerId = new ObjectId()
const eventId = new ObjectId()
const email = `organisateur-group-${organizerId}@test.com`
const buyerEmail = `buyer-group-${buyerId}@test.com`
let client: MongoClient

test.beforeAll(async () => {
  if (!uri.split('?')[0].split('/').pop()?.includes('test')) throw new Error('Base de test requise')
  client = await new MongoClient(uri).connect()
  const now = new Date()
  await client.db().collection('users').insertOne({
    _id: organizerId, email, passwordHash: await bcrypt.hash(seededPassword, 10),
    firstName: 'Recette', lastName: 'Groupe', roles: ['organisateur'], activeRole: 'organisateur', orgStatus: 'active',
    emailVerifiedAt: now, disabled: false, sessionVersion: 0, createdAt: now, updatedAt: now,
  })
  await client.db().collection('users').insertOne({
    _id: buyerId, email: buyerEmail, passwordHash: await bcrypt.hash(seededPassword, 10),
    firstName: 'Client', lastName: 'Recette', roles: ['client'], activeRole: 'client',
    emailVerifiedAt: now, disabled: false, sessionVersion: 0, createdAt: now, updatedAt: now,
  })
  await client.db().collection('applications').insertOne({
    userId: String(organizerId), type: 'organisateur', status: 'approved',
    formData: { pays: 'Bénin', ville: 'Cotonou', nomCommercial: 'Recette groupes' }, createdAt: now, updatedAt: now,
  })
  await client.db().collection('events').insertOne({
    _id: eventId, name: 'Recette table Cotonou', date: '2099-01-01', time: '22:00', endTime: '05:00',
    createdBy: String(organizerId), organizerId: String(organizerId), region: 'Bénin', city: 'Cotonou', currency: 'XOF',
    cancelled: false, isDemo: false, published: true, publishAt: null, minAge: 0, menu: [], createdAt: now, updatedAt: now,
    places: [{ id: 'table', type: 'Table recette', price: 120_000, available: 3, total: 3, groupType: 'group', groupMin: 2, groupMax: 8, excludedMenu: [], photos: [] }],
  })
})
test.afterAll(async () => {
  if (!client) return
  await client.db().collection('events').deleteOne({ _id: eventId })
  await client.db().collection('users').deleteMany({ _id: { $in: [organizerId, buyerId] } })
  await client.db().collection('applications').deleteMany({ userId: String(organizerId) })
  await client.db().collection('organizerprofiles').deleteMany({ userId: String(organizerId) })
  await client.close()
})

test('le recapitulatif public compte les huit admissions', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(buyerEmail)
  await page.getByLabel('Mot de passe', { exact: true }).fill(seededPassword)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL(/\/profile/)
  await page.goto(`/events/${eventId}`)
  await dismissCookieBanner(page)
  await page.getByRole('button', { name: /Table recette/ }).first().click()
  await expect(page.getByText(/avec 8 entrées incluses/)).toBeVisible()
  await expect(page.getByText(/6[\s\u00a0\u202f]000 FCFA/, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/126[\s\u00a0\u202f]000 FCFA/, { exact: true }).first()).toBeVisible()
})

test('la confirmation agent inclut les frais sans case pour sous-declarer le groupe', async ({ page }) => {
  await loginSeededUser(page, email)
  await expect(page.getByRole('heading', { name: 'Studio Organisateur', exact: true })).toBeVisible()
  await page.goto(`/on-site-sales/${eventId}`)
  await dismissCookieBanner(page)
  await expect(page.getByText('Vente de la place de groupe entière : 8 entrées incluses.')).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Encaisser la vente' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/126[\s\u00a0\u202f]000 FCFA/, { exact: true })).toBeVisible()
  await expect(dialog.getByText(/Frais LIB : 6[\s\u00a0\u202f]000 FCFA/)).toBeVisible()
  // Ne pas confirmer : cette recette verifie le recapitulatif, pas un paiement.
})

test('les lectures de session ne remplacent pas le cookie CSRF et un faux jeton reste refuse', async ({ request }) => {
  const csrf = await request.get('/api/auth/csrf')
  expect(csrf.status()).toBe(200)
  expect(csrf.headers()['set-cookie']).toContain('authjs.csrf-token=')
  const reads = await Promise.all([request.get('/api/auth/session'), request.get('/api/auth/providers')])
  for (const response of reads) expect(response.headers()['set-cookie'] || '').not.toContain('authjs.csrf-token=')
  const rejected = await request.post('/api/auth/callback/credentials', {
    headers: { 'X-Auth-Return-Redirect': '1' },
    form: { csrfToken: 'invalid-test-token', email: buyerEmail, password: seededPassword },
  })
  const result = await rejected.json()
  expect(new URL(result.url).searchParams.get('error')).toBe('MissingCSRF')
  expect((await request.storageState()).cookies.some((cookie) => cookie.name.includes('session-token'))).toBe(false)
})
