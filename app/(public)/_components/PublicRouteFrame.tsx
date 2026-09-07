'use client'

import type { CSSProperties, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const PUBLIC_BACKGROUNDS: Array<{ matches: (pathname: string) => boolean; image: string; position?: string }> = [
  { matches: (pathname) => pathname === '/home', image: '/images/live-in-black/night-benin/night-benin-concert.png', position: '58% center' },
  { matches: (pathname) => pathname.startsWith('/events'), image: '/images/live-in-black/night-benin/night-benin-dancefloor.png', position: 'center 38%' },
  { matches: (pathname) => pathname.startsWith('/providers'), image: '/images/live-in-black/night-benin/night-benin-organizer.png', position: 'center 30%' },
  { matches: (pathname) => pathname.startsWith('/organizers'), image: '/images/live-in-black/night-benin/night-benin-rooftop.png', position: 'center 30%' },
  { matches: (pathname) => pathname === '/about', image: '/images/live-in-black/night-benin/night-benin-rooftop.png', position: 'center 34%' },
  { matches: (pathname) => pathname.startsWith('/blog'), image: '/images/live-in-black/night-benin/night-benin-lounge.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/contact', image: '/images/live-in-black/night-benin/night-benin-dj.png', position: 'center 30%' },
  { matches: (pathname) => pathname === '/cookies', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/privacy', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/terms', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/legal-notice', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/organizer-signup', image: '/images/live-in-black/night-benin/night-benin-rooftop.png', position: 'center 28%' },
  { matches: (pathname) => pathname === '/provider-signup', image: '/images/live-in-black/night-benin/night-benin-organizer.png', position: 'center 28%' },
  { matches: (pathname) => pathname === '/login', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 30%' },
  { matches: (pathname) => pathname === '/reset-password', image: '/images/live-in-black/night-benin/night-benin-hero.png', position: 'center 30%' },
  { matches: (pathname) => pathname === '/verify-email', image: '/images/live-in-black/night-benin/night-benin-dancefloor.png', position: 'center 34%' },
  { matches: (pathname) => pathname === '/confirmer-email', image: '/images/live-in-black/night-benin/night-benin-rooftop.png', position: 'center 34%' },
  { matches: (pathname) => pathname === '/payment-success', image: '/images/live-in-black/night-benin/night-benin-concert.png', position: 'center 38%' },
  { matches: (pathname) => pathname === '/boost-active', image: '/images/live-in-black/night-benin/night-benin-concert.png', position: 'center 38%' },
]

export default function PublicRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const background = PUBLIC_BACKGROUNDS.find((item) => item.matches(pathname)) ?? PUBLIC_BACKGROUNDS[0]
  const style = {
    '--lb-public-background-image': `url('${background.image}')`,
    '--lb-public-background-position': background.position ?? 'center',
  } as CSSProperties

  return <div className="lb-public-layout" style={style}>{children}</div>
}
