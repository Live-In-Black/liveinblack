import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrganizerDeepAnalytics } from '@/lib/server/organizer/organizerDeepAnalytics'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const result = await getOrganizerDeepAnalytics(session.user.id)
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status })
  }

  return NextResponse.json(result)
}
