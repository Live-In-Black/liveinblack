'use client'

import type { ReactNode } from 'react'
import Button from './Button'
import Modal from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body: ReactNode
  children?: ReactNode
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  confirmDisabled?: boolean
  confirmLoading?: boolean
  confirmLoadingText?: string
  maxWidth?: number
  zIndex?: number
}

// Dialogue de confirmation partagé pour les actions simples de type
// "annuler / confirmer". Centralise la structure, les espacements et les
// labels par défaut au lieu de répéter des modales quasi identiques.
export default function ConfirmDialog({
  open,
  title,
  body,
  children,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmVariant = 'danger',
  confirmDisabled,
  confirmLoading,
  confirmLoadingText,
  maxWidth,
  zIndex,
}: ConfirmDialogProps) {
  if (!open) return null

  const isDanger = confirmVariant === 'danger'

  return (
    <Modal onClose={onCancel} maxWidth={maxWidth ?? 420} zIndex={zIndex}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          padding: '24px 12px 12px',
          minHeight: 280,
          justifyContent: 'center',
        }}
      >
        {/* Badge / Illustration visuelle pour une modale carrée et premium */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 45, 117, 0.12)',
            border: isDanger ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 45, 117, 0.25)',
            boxShadow: isDanger ? '0 8px 24px rgba(239, 68, 68, 0.15)' : '0 8px 24px rgba(255, 45, 117, 0.15)',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDanger ? '#ef4444' : 'var(--primary)'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
            {title}
          </h3>
          <div style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {body}
          </div>
        </div>

        {children}

        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={confirmDisabled || confirmLoading}
            style={{ flex: 1, minHeight: 46 }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={confirmLoading}
            loadingText={confirmLoadingText}
            style={{ flex: 1, minHeight: 46, textTransform: 'none', letterSpacing: 'normal' }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
