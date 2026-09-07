import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthSplitLayout from '../_components/AuthSplitLayout'
import AuthForm from './AuthForm'
import { Skeleton } from '@/app/components/ui'

// Port de src/pages/LoginPage.jsx (#118) — remplace le stub Phase 1
// (Credentials/JWT only, voir git history). `useSearchParams` (dans
// AuthForm) exige une frontière Suspense pour ne pas bloquer le
// pré-rendu statique.
export const metadata: Metadata = {
  title: 'Connexion / Inscription — LIVEINBLACK',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <AuthSplitLayout
      tagline={
        <>
          Toute la scène.
          <br />
          <span>Une seule expérience.</span>
        </>
      }
    >
      <Suspense fallback={<AuthFormFallback />}>
        <AuthForm />
      </Suspense>
    </AuthSplitLayout>
  )
}

function AuthFormFallback() {
  return (
    <div aria-label="Chargement du formulaire" style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <Skeleton width={160} height={32} style={{ marginBottom: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 18, border: '1px solid var(--border)', borderRadius: 18, background: 'var(--card-bg)' }}>
        <Skeleton width="44%" height={14} />
        <Skeleton width="100%" height={48} radius={12} />
        <Skeleton width="38%" height={14} />
        <Skeleton width="100%" height={48} radius={12} />
        <Skeleton width="100%" height={46} radius={999} style={{ marginTop: 6 }} />
        <Skeleton width="62%" height={12} style={{ alignSelf: 'center' }} />
      </div>
    </div>
  )
}
