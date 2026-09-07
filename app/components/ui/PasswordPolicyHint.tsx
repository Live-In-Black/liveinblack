'use client'

import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { PASSWORD_MIN_LENGTH } from '@/lib/shared/passwordPolicy'
import Button from './Button'

export default function PasswordPolicyHint() {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Button
        variant="ghost"
        aria-label="Conditions du mot de passe"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}
        style={{ width: 28, minHeight: 28, height: 28, padding: 4 }}
      >
        <Info size={16} aria-hidden="true" />
      </Button>
      <span id={id} hidden={!open} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, width: 190, padding: 10, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', color: 'var(--text)', fontSize: 'var(--font-size-footnote)', lineHeight: 1.5 }}>
        Au moins {PASSWORD_MIN_LENGTH} caractères, une majuscule et un chiffre.
      </span>
    </span>
  )
}
