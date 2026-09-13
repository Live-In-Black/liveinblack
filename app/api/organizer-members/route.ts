import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listOrganizerMembers, createOrganizerMember } from '@/lib/server/organizer/organizerMembers'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const result = await listOrganizerMembers({ id: session.user.id })
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status })
  }

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = await createOrganizerMember({ id: session.user.id }, body)
    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
}
