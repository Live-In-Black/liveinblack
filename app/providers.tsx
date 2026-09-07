'use client'

import { SessionProvider } from 'next-auth/react'
import AccountPresence from './components/AccountPresence'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider><AccountPresence />{children}</SessionProvider>
}
