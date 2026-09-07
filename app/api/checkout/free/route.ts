export const maxDuration = 60;
import { NextResponse } from 'next/server'

// V1 Benin : R58 retient les evenements payants. Les invitations/guestlists
// restent separees ; ce checkout public gratuit legacy est ferme.

export async function POST(req: Request) {
  void req
  return NextResponse.json({ error: 'free_checkout_disabled_v1' }, { status: 410 })
}
