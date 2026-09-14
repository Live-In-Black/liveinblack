import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateOrganizerMember, deleteOrganizerMember } from '@/lib/server/organizer/organizerMembers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const result = await updateOrganizerMember({ id: session.user.id }, id, body)
    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await deleteOrganizerMember({ id: session.user.id }, id)
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status })
  }
  return NextResponse.json(result)
}
