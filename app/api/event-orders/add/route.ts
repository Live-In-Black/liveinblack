import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// V1 : les consommations sont achetees avec le billet, pas ajoutees ensuite.
// Les routes de materialisation, consultation et remise restent distinctes.
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  return NextResponse.json({
    error: 'standalone_orders_disabled_v1',
    message: 'Les consommations doivent être précommandées lors de l’achat du billet.',
  }, { status: 410 })
}
