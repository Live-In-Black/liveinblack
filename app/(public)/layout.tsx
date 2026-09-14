import dynamic from 'next/dynamic'
import { Footer, PublicNav } from '@/app/components/layout'
import PublicRouteFrame from './_components/PublicRouteFrame'
import './public-system.css'

const AmbientMusicPlayer = dynamic(
  () => import('@/app/components/layout/AmbientMusicPlayer')
)

export default function PublicLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <PublicRouteFrame>
      <PublicNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <Footer />
      <AmbientMusicPlayer />
      {modal}
    </PublicRouteFrame>
  )
}
