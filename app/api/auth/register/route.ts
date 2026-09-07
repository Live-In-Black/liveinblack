import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db/mongoose'
import User from '@/lib/models/User'
import { issueVerificationToken } from '@/lib/auth/verification-tokens'
import { emailVerificationEmail } from '@/lib/server/emails'
import { sendEmail } from '@/lib/server/email'
import { runObservedRoute } from '@/lib/server/observability'
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit'
import { isPasswordPolicyCompliant } from '@/lib/shared/passwordPolicy'
import { normalizeStoredContactPhone } from '@/lib/shared/contactPhone'

const SITE = process.env.PUBLIC_SITE_URL || 'https://liveinblack.com'
const currentYear = new Date().getFullYear()

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128).refine(isPasswordPolicyCompliant, 'Le mot de passe ne respecte pas la politique de sécurité.'),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
  birthYear: z.number().int().min(currentYear - 80).max(currentYear - 13).nullable().optional(),
  gender: z.enum(['femme', 'homme', 'autre']).nullable().optional(),
})

export async function POST(req: Request) {
  return runObservedRoute(req, { route: '/api/auth/register', operation: 'auth_register' }, async () => {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, password, firstName, lastName, phone, birthYear, gender } = parsed.data

    const rateLimit = await checkRateLimit({
      scope: 'auth-register-ip',
      identifier: getRequestIp(req),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const contactPhone = phone ? normalizeStoredContactPhone(phone) : ''
    if (phone && !contactPhone) {
      return NextResponse.json({ error: 'invalid_phone', message: 'Numéro de téléphone invalide. Utilise le format international avec indicatif.' }, { status: 400 })
    }

    await getDb()

    const existing = await User.findOne({ email }).lean()
    if (existing) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    let user
    try {
      user = await User.create({
        email,
        passwordHash,
        firstName,
        lastName,
        phone: contactPhone || '',
        birthYear: birthYear ?? null,
        gender: gender ?? null,
        roles: ['client'],
        activeRole: 'client',
        status: 'active',
      })
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return NextResponse.json({ error: 'email_taken' }, { status: 409 })
      }
      throw error
    }

    const token = await issueVerificationToken(String(user._id), email, 'verify-email')
    const verifyLink = `${SITE}/verify-email?email=${encodeURIComponent(email)}&token=${token}`
    const emailResult = await sendEmail(email, emailVerificationEmail(verifyLink, SITE))
    if (!emailResult.ok) {
      // Le compte est créé même si l'email échoue à partir — l'utilisateur peut
      // redemander l'envoi plus tard (pas de rollback : mieux vaut un compte non
      // vérifié qu'une inscription perdue à cause d'un souci Resend ponctuel).
      console.error('[register] verification email failed for', email, emailResult.error)
    }

    return NextResponse.json({ ok: true, id: String(user._id) }, { status: 201 })
  })
}
