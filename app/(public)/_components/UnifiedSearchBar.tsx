'use client'

import { useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button, Input } from '@/app/components/ui'

export default function UnifiedSearchBar({
  actionUrl,
  placeholder,
  defaultValue = '',
  extraParams = {},
}: {
  actionUrl: string
  placeholder: string
  defaultValue?: string
  extraParams?: Record<string, string>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function updateSearch(q: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set('q', q.trim())
      } else {
        params.delete('q')
      }
      params.delete('page') // Reset pagination on search
      Object.entries(extraParams).forEach(([key, val]) => {
        if (val) params.set(key, val)
      })
      const queryString = params.toString()
      startTransition(() => {
        router.replace(`${actionUrl}${queryString ? `?${queryString}` : ''}`, { scroll: false })
      })
    }, 280)
  }

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 'min(100%, 720px)',
        minHeight: 52,
        margin: '24px 0 0',
        padding: '5px 6px 5px 18px',
        border: '1px solid var(--border)',
        borderRadius: 999,
        background: 'var(--surface)',
        transition: 'border-color 160ms ease',
      }}
    >
      <Input
        type="search"
        defaultValue={defaultValue}
        onChange={(e) => updateSearch(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        containerStyle={{ flex: 1, minWidth: 0 }}
        style={{
          border: 0,
          background: 'transparent',
          boxShadow: 'none',
          fontSize: '15px',
          color: 'var(--text)',
        }}
      />
      <Button
        type="submit"
        aria-label="Lancer la recherche"
        disabled={isPending}
        style={{
          width: 44,
          height: 44,
          minWidth: 44,
          minHeight: 44,
          padding: 0,
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'var(--primary-ink)',
          border: 0,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(255, 45, 117, 0.35)',
        }}
      >
        <Search size={19} strokeWidth={2.5} aria-hidden="true" />
      </Button>
    </form>
  )
}
