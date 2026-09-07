import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getDb } from '@/lib/db/mongoose'
import User, { ROLES } from '@/lib/models/User'

// Les comptes client, organisateur et prestataire sont mono-type et ne
// peuvent plus changer d'espace depuis une même connexion. La route reste
// tolérante pour un appel idempotent sur le rôle déjà actif et pour les
// permissions agent historiques, mais refuse toute bascule métier.
const bodySchema = z.object({ role: z.enum(ROLES) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 })

  await getDb()
  const user = await User.findById(session.user.id).select('roles activeRole').lean()
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!user.roles.includes(parsed.data.role)) {
    return NextResponse.json({ error: 'role_not_owned' }, { status: 403 })
  }

  if (parsed.data.role !== user.activeRole) {
    return NextResponse.json({ error: 'account_type_fixed' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, activeRole: parsed.data.role })
}
