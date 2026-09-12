import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listMyOrganizerEvents } from '@/lib/server/organizer/organizerEvents'
import { getPayoutStatus } from '@/lib/server/organizer/organizerPayouts'
import { listPayoutMomos } from '@/lib/server/organizer/organizerPayoutMomos'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Tableau de bord — LIVEINBLACK',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const permissionUser = {
    activeRole: session.user.activeRole,
    status: session.user.status,
    orgStatus: session.user.orgStatus,
    prestStatus: session.user.prestStatus,
  }

  if (permissionUser.activeRole !== 'organisateur' && permissionUser.activeRole !== 'agent') {
    redirect('/profile')
  }

  const [eventsResult, payoutStatusResult, momosResult] = await Promise.all([
    listMyOrganizerEvents({ id: session.user.id }),
    getPayoutStatus({ id: session.user.id }),
    listPayoutMomos({ id: session.user.id }),
  ])

  return (
    <DashboardClient
      events={eventsResult.events}
      payoutStatus={payoutStatusResult.ok ? payoutStatusResult.view : null}
      momos={momosResult.ok ? momosResult.momos : {}}
      userName={session.user.name || 'Organisateur'}
    />
  )
}
