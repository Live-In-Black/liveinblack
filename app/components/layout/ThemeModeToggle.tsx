'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { IconButton, Button } from '@/app/components/ui'

export function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem('lib_theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch (_) {}
  return 'dark'
}

export function toggleThemeMode(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  const current = (document.documentElement.dataset.theme as 'dark' | 'light') || getInitialTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  try {
    window.localStorage.setItem('lib_theme', next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    window.dispatchEvent(new Event('lib_theme_change'))
  } catch (_) {}
  return next
}

export default function ThemeModeToggle({
  variant = 'icon',
  size = 40,
}: {
  variant?: 'icon' | 'row'
  size?: number
}) {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const current = (document.documentElement.dataset.theme as 'dark' | 'light') || getInitialTheme()
    setThemeState(current)

    const handleThemeChange = () => {
      const active = (document.documentElement.dataset.theme as 'dark' | 'light') || 'dark'
      setThemeState(active)
    }

    window.addEventListener('lib_theme_change', handleThemeChange)
    return () => window.removeEventListener('lib_theme_change', handleThemeChange)
  }, [])

  function handleToggle() {
    const next = toggleThemeMode()
    setThemeState(next)
  }

  const isLight = theme === 'light'
  const label = isLight ? 'Passer en mode sombre' : 'Passer en mode clair'

  if (variant === 'row') {
    return (
      <Button
        variant="secondary"
        onClick={handleToggle}
        style={{
          width: '100%',
          justifyContent: 'flex-start',
          minHeight: 40,
          padding: '8px 14px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--text)',
          fontSize: 'var(--font-size-body-sm)',
          fontWeight: 600,
        }}
      >
        {isLight ? (
          <Moon size={17} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Sun size={17} strokeWidth={2} aria-hidden="true" />
        )}
        <span>{mounted ? (isLight ? 'Passer au mode sombre' : 'Passer au mode clair') : 'Changer le thème'}</span>
      </Button>
    )
  }

  return (
    <IconButton
      onClick={handleToggle}
      label={mounted ? label : 'Changer le thème'}
      icon={
        isLight ? (
          <Moon size={17} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Sun size={17} strokeWidth={2} aria-hidden="true" />
        )
      }
      size={size}
      style={{
        background: 'var(--surface-2)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        flexShrink: 0,
      }}
    />
  )
}
