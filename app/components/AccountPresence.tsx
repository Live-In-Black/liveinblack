'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function AccountPresence() {
  const { status } = useSession()
  useEffect(() => {
    if (status !== 'authenticated') return
    let pending = false
    const controller = new AbortController()
    async function heartbeat() {
      if (document.visibilityState !== 'visible' || pending) return
      pending = true
      try {
        await fetch('/api/users/presence', { method: 'POST', signal: controller.signal })
      } catch {
        // La presence ne doit pas interrompre la navigation en reseau faible.
      } finally {
        pending = false
      }
    }
    void heartbeat()
    const interval = setInterval(() => void heartbeat(), 20_000)
    document.addEventListener('visibilitychange', heartbeat)
    return () => {
      controller.abort()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', heartbeat)
    }
  }, [status])
  return null
}
