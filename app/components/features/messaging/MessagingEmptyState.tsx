import type { ReactNode } from 'react'

export default function MessagingEmptyState(props: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ minHeight: 'clamp(400px, 58vh, 660px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 'clamp(44px, 7vw, 84px) 24px', textAlign: 'center' }}>
      <div aria-hidden="true" style={{ width: 76, height: 76, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
        {props.icon}
      </div>
      <p style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 780, color: 'var(--text)', margin: 0 }}>{props.title}</p>
      <p style={{ fontSize: 'var(--font-size-headline)', color: 'var(--text-faint)', margin: 0, maxWidth: 460, lineHeight: 1.55 }}>{props.subtitle}</p>
    </div>
  )
}
