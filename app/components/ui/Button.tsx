'use client'

import { forwardRef, useState } from 'react'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import Spinner from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  icon?: React.ReactNode
}

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { minHeight: 'var(--control-height-sm)', padding: '3px 10px', fontSize: 'var(--font-size-footnote)', borderRadius: 'var(--radius-control)', gap: 5 },
  md: { minHeight: 'var(--control-height-md)', padding: '4px 12px', fontSize: 'var(--font-size-callout)', borderRadius: 'var(--radius-control)', gap: 6 },
  lg: { minHeight: 28, padding: '5px 14px', fontSize: 'var(--font-size-body)', borderRadius: 'var(--radius-control)', gap: 7 },
}

function variantStyle(variant: ButtonVariant, disabled: boolean): CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: disabled ? 'var(--primary-a35)' : 'var(--primary)',
        color: 'var(--primary-ink)',
        border: '1px solid transparent',
      }
    case 'secondary':
      return {
        background: 'transparent',
        color: 'var(--text)',
        border: '1px solid var(--primary-a55)',
      }
    case 'danger':
      return {
        background: disabled ? 'color-mix(in srgb, var(--danger) 35%, transparent)' : 'var(--danger)',
        color: 'var(--danger-ink)',
        border: '1px solid transparent',
      }
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid transparent',
      }
    case 'link':
      return {
        background: 'transparent',
        color: 'var(--accent-text)',
        border: 'none',
        padding: 0,
        textDecoration: 'underline',
      }
  }
}

// Bouton custom unique de l'app — jamais de <button> brut stylé inline
// ailleurs (voir CLAUDE.md, design system). variant='link' retombe sur un
// style texte-seul (pas de padding/fond), pour les actions secondaires
// discrètes qui utilisaient auparavant un <button> sans style.
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText, fullWidth, icon, disabled, style, children, type = 'button', ...rest },
  ref
) {
  const isDisabled = Boolean(disabled || loading)
  const isLink = variant === 'link'
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  // Feedback hover/active centralisé ici (et pas via className, volontairement
  // absent de ButtonProps — voir commentaire plus bas) pour que tous les
  // boutons de l'app répondent visuellement sans dupliquer de CSS par écran.
  const interactive = !isDisabled && !isLink
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      data-lb-button={variant}
      {...rest}
      onMouseEnter={(e) => { setHovered(true); rest.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); rest.onMouseLeave?.(e) }}
      onMouseDown={(e) => { setPressed(true); rest.onMouseDown?.(e) }}
      onMouseUp={(e) => { setPressed(false); rest.onMouseUp?.(e) }}
      aria-busy={loading || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: isDisabled ? (loading ? 'wait' : 'not-allowed') : 'pointer',
        width: fullWidth ? '100%' : undefined,
        transition: 'transform 0.1s ease, filter 0.15s ease',
        opacity: 1,
        filter: interactive && hovered ? 'brightness(1.08)' : undefined,
        transform: interactive && pressed ? 'translateY(1px)' : undefined,
        ...(isLink ? {} : SIZE_STYLES[size]),
        ...variantStyle(variant, isDisabled),
        ...style,
        ...(!isLink ? { borderRadius: 'var(--radius-control)' } : {}),
      }}
    >
      {loading ? <Spinner text={loadingText} /> : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
})

export default Button
